import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: join(__dirname, '.env') });

console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost origin during development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // In production, use the specific CLIENT_URL
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
import schedulesRoutes from './routes/schedules.js';
app.use('/api/auth', authRoutes);
app.use('/api/labs', labsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/computers', computersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/schedules', schedulesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

export default app;
