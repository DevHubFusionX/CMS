const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

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
const getAllowedOrigins = () => {
  const baseOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];
  const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [];
  return [...baseOrigins, ...envOrigins];
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost in development
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Temporary: Allow Vercel app directly
    if (origin === 'https://fusionx-nine.vercel.app') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      console.log('ENV ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
      console.log('Parsed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token']
};

// Standard middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JWT-based CSRF protection
const jwt = require('jsonwebtoken');

const generateCSRFToken = () => {
  const payload = {
    type: 'csrf',
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex')
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const csrfProtection = (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'];
  
  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token required'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'csrf') {
      throw new Error('Invalid token type');
    }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }
};

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = generateCSRFToken();
  res.json({ csrfToken: token });
});

// Apply CSRF protection to state-changing routes
app.use('/api/posts', csrfProtection);
app.use('/api/users', csrfProtection);
app.use('/api/media', csrfProtection);
app.use('/api/categories', csrfProtection);
app.use('/api/tags', csrfProtection);
app.use('/api/comments', csrfProtection);
app.use('/api/settings', csrfProtection);

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