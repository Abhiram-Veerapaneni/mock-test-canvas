import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import examRoutes from './routes/exam.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://mock-test-canvas.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or non-browser tools (e.g. Postman)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    // allows everything (dev mode)
    // return callback(null, true);
    // strict (Blocks unapproved origins)
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // To handle preflight requests

// Create HTTP Server & Initialize Socket.IO
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOptions.origin,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Store io instance on app for controller access
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Test creator / examiner joins personal notification room
  socket.on('join_creator', (creatorId) => {
    if (creatorId) {
      socket.join(`creator_${creatorId}`);
      socket.join(`user_${creatorId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined creator_${creatorId}`);
    }
  });

  // User joins their personal notification room
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      socket.join(`creator_${userId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined user_${userId}`);
    }
  });

  // Client joins specific exam room for live monitoring
  socket.on('join_exam', (examId) => {
    if (examId) {
      socket.join(`exam_${examId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined exam_${examId}`);
    }
  });

  socket.on('disconnect', () => {
    // disconnected
  });
});

// Express JSON parsing middleware with 10mb limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting in production or general traffic
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}

// Health Check Endpoint (supports both /api/health and /health)
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Server] Mock Test Canvas API & Socket.IO running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
});

export { io };
export default app;
