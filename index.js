const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import utilities
const logger = require('./utils/logger');
const { initScheduledTasks } = require('./utils/scheduledTasks');

// Import models to ensure they're registered
require('./models/Role');
require('./models/User');

// Import routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const categoriesRoutes = require('./routes/categories');
const tagsRoutes = require('./routes/tags');
const usersRoutes = require('./routes/users');
const commentsRoutes = require('./routes/comments');
const mediaRoutes = require('./routes/media');
const settingsRoutes = require('./routes/settings');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Trust proxy for deployment behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', apiLimiter);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'http://127.0.0.1:5173',
    'https://fusionx-nine.vercel.app',
    'https://cms-2prb.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Standard middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    const err = new Error('Request timeout');
    err.statusCode = 408;
    next(err);
  });
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB and setup
const { connectDB, setupIndexes } = require('./utils/database');
connectDB()
  .then(async () => {
    // Setup database indexes
    await setupIndexes();
    
    // Initialize scheduled tasks after DB connection
    initScheduledTasks();
  })
  .catch(err => {
    logger.error('Could not connect to MongoDB', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  
  // Send appropriate error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    message: statusCode === 500 ? 'Something went wrong!' : err.message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Give the logger time to log the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});