import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// All routes are protected with JWT middleware
router.use(authenticateToken);

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// Debug middleware to log requests
router.use((req, res, next) => {
  console.log('Users route accessed:', {
    method: req.method,
    path: req.path,
    user: req.user,
    headers: req.headers
  });
  next();
});

// GET /api/users - Get users with optional role filter
router.get('/', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    const whereClause = {};
    if (role) {
      whereClause.role = role;
    }
    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          fullName: 'asc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { username, password, fullName, email, role } = req.body;

    // Validation
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, password, full name, and role are required' 
      });
    }

    if (!['ADMIN', 'INSTRUCTOR', 'STUDENT'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be ADMIN, INSTRUCTOR, or STUDENT' 
      });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        email: email || null,
        role
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Log the action
    await prisma.systemLog.create({
      data: {
        action: 'USER_CREATED',
        description: `User ${username} created by admin ${req.user.username}`,
        userId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    res.status(201).json({ 
      success: true, 
      data: user, 
      message: 'User created successfully' 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, fullName, email, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username }
      });

      if (usernameExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already exists' 
        });
      }
    }

    // Validate role if provided
    if (role && !['ADMIN', 'INSTRUCTOR', 'STUDENT'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be ADMIN, INSTRUCTOR, or STUDENT' 
      });
    }

    // Update user
    const updateData = {};
    if (username) updateData.username = username;
    if (fullName) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (role) updateData.role = role;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    // Log the action
    await prisma.systemLog.create({
      data: {
        action: 'USER_UPDATED',
        description: `User ${user.username} updated by admin ${req.user.username}`,
        userId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    res.json({ 
      success: true, 
      data: user, 
      message: 'User updated successfully' 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deletion of the current admin
    if (user.id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    // Log the action
    await prisma.systemLog.create({
      data: {
        action: 'USER_DELETED',
        description: `User ${user.username} deleted by admin ${req.user.username}`,
        userId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// POST /api/users/:id/reset-password - Reset user password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword }
    });

    // Log the action
    await prisma.systemLog.create({
      data: {
        action: 'PASSWORD_RESET',
        description: `Password reset for user ${user.username} by admin ${req.user.username}`,
        userId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

export default router;
