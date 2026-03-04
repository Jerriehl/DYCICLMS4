import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: join(__dirname, '.env') });

console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      const allowedOrigin = process.env.CLIENT_URL;
      if (origin === allowedOrigin) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }
});

const prisma = new PrismaClient();

// Store connected users
const connectedUsers = new Map();

// Socket.io authentication middleware
io.use(async (socket, next) => {
  console.log('Socket connection attempt received:', socket.id);
  console.log('Socket handshake auth:', socket.handshake.auth);
  try {
    const token = socket.handshake.auth.token;
    console.log('Token received:', token ? 'Yes' : 'No');
    if (!token) {
      console.log('Rejecting socket - no token');
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded, userId:', decoded.id);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, fullName: true, role: true }
    });

    if (!user) {
      console.log('Rejecting socket - user not found');
      return next(new Error('User not found'));
    }

    console.log('Socket authenticated for user:', user.fullName);
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Invalid token'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.fullName} (${socket.user.id})`);
  
  // Store user connection
  connectedUsers.set(socket.user.id, {
    socketId: socket.id,
    user: socket.user,
    lastSeen: new Date()
  });

  // Join personal room for direct messages
  socket.join(`user_${socket.user.id}`);

  // Chat app: addUser event
  let activeUsers = [];
  socket.on('addUser', (userId) => {
    const isUserExist = activeUsers.find(user => user.userId === userId);
    if (!isUserExist) {
      const user = { userId, socketId: socket.id };
      activeUsers.push(user);
      io.emit('getUsers', activeUsers);
    }
  });

  // Chat app: sendMessage event
  socket.on('sendMessage', async ({ senderId, receiverId, message, conversationId }) => {
    const receiver = activeUsers.find(user => user.userId === receiverId);
    const sender = activeUsers.find(user => user.userId === senderId);
    const senderUser = await prisma.user.findUnique({
      where: { id: parseInt(senderId) },
      select: { id: true, fullName: true, username: true }
    });
    
    console.log('Message sent from', senderId, 'to', receiverId);
    
    if (receiver) {
      io.to(receiver.socketId).to(sender.socketId).emit('getMessage', {
        senderId,
        message,
        conversationId,
        receiverId,
        user: { id: senderUser.id, fullName: senderUser.fullName }
      });
    } else if (sender) {
      io.to(sender.socketId).emit('getMessage', {
        senderId,
        message,
        conversationId,
        receiverId,
        user: { id: senderUser.id, fullName: senderUser.fullName }
      });
    }
    
    // Also emit to room for multi-device support
    io.to(`user_${receiverId}`).emit('getMessage', {
      senderId,
      message,
      conversationId,
      receiverId,
      user: { id: senderUser.id, fullName: senderUser.fullName }
    });
  });

  // Join group rooms
  socket.on('join_groups', async () => {
    try {
      const memberships = await prisma.groupMember.findMany({
        where: { userId: socket.user.id },
        select: { groupId: true }
      });
      
      memberships.forEach(membership => {
        socket.join(`group_${membership.groupId}`);
      });
      console.log(`User ${socket.user.id} joined ${memberships.length} groups`);
    } catch (error) {
      console.error('Error joining groups:', error);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { receiverId, groupId, isTyping } = data;
    
    if (groupId) {
      socket.to(`group_${groupId}`).emit('user_typing', {
        userId: socket.user.id,
        userName: socket.user.fullName,
        groupId,
        isTyping
      });
    } else if (receiverId) {
      socket.to(`user_${receiverId}`).emit('user_typing', {
        userId: socket.user.id,
        userName: socket.user.fullName,
        isTyping
      });
    }
  });

  // Handle message status updates
  socket.on('message_status', async (data) => {
    const { messageId, status } = data;
    
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { senderId: true }
      });

      if (message) {
        await prisma.message.update({
          where: { id: messageId },
          data: { status }
        });

        // Notify sender about status change
        io.to(`user_${message.senderId}`).emit('message_status_update', {
          messageId,
          status,
          updatedBy: socket.user.id
        });
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  });

  // Handle user status request
  socket.on('get_user_status', (userId, callback) => {
    const user = connectedUsers.get(userId);
    callback({
      online: !!user,
      lastSeen: user?.lastSeen || null
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.fullName} (${socket.user.id})`);
    connectedUsers.delete(socket.user.id);
    
    // Remove from active users
    activeUsers = activeUsers.filter(user => user.socketId !== socket.id);
    io.emit('getUsers', activeUsers);
    
    // Broadcast offline status to relevant users
    socket.broadcast.emit('user_offline', {
      userId: socket.user.id,
      lastSeen: new Date()
    });
  });
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    const allowedOrigin = process.env.CLIENT_URL;
    if (origin === allowedOrigin) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Routes
import authRoutes from './routes/auth.js';
import labsRoutes from './routes/labs.js';
import usersRoutes from './routes/users.js';
import computersRoutes from './routes/computers.js';
import dashboardRoutes from './routes/dashboard.js';
import messagingRoutes from './routes/messaging.js';
app.use('/api/auth', authRoutes);
app.use('/api/labs', labsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/computers', computersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messaging', messagingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    connectedUsers: connectedUsers.size
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.io is ready for real-time messaging`);
  console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

export default app;
