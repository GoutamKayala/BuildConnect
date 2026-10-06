import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/authRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import agreementRoutes from './routes/agreementRoutes.js';
import milestoneRoutes from './routes/milestoneRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();

// Security Headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS configuration
const rawFrontend = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim() : '';
const cleanFrontend = rawFrontend.replace(/\/+$/, '');
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  cleanFrontend,
  cleanFrontend && !/^https?:\/\//i.test(cleanFrontend) ? `https://${cleanFrontend}` : null,
  cleanFrontend && !/^https?:\/\//i.test(cleanFrontend) ? `http://${cleanFrontend}` : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        allowedOrigins.some((ao) => origin.startsWith(ao.replace(/\/+$/, ''))) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');
      if (isAllowed) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Mongo Sanitization against query injection
app.use(mongoSanitize());

// Rate Limiter
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'BuildConnect API Server',
    timestamp: new Date(),
  });
});

// Serve frontend build if available (supports all-in-one deployment)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[API ERROR] ${statusCode} - ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
});

export default app;
