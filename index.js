const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const crypto = require('crypto')
const { createServer } = require('http')
const { Server } = require('socket.io')

// Import utilities
const logger = require('./utils/logger')
const { initScheduledTasks } = require('./utils/scheduledTasks')

// Import models to ensure they're registered
const Role = require('./models/Role')
const User = require('./models/User')

// Import routes
const authRoutes = require('./routes/auth')
const postsRoutes = require('./routes/posts')
const categoriesRoutes = require('./routes/categories')
const tagsRoutes = require('./routes/tags')
const usersRoutes = require('./routes/users')
const commentsRoutes = require('./routes/comments')
const mediaRoutes = require('./routes/media')
const settingsRoutes = require('./routes/settings')
const analyticsRoutes = require('./routes/analytics')
const aiRoutes = require('./routes/ai')
const sitemapRoutes = require('./routes/sitemap')
const backupRoutes = require('./routes/backup')
const pagesRoutes = require('./routes/pages')
const sitesRoutes = require('./routes/sites')
const subscriptionsRoutes = require('./routes/subscriptions')

// Load environment variables
dotenv.config()

// Initialize express app and HTTP server
const app = express()
const server = createServer(app)

// Trust proxy for deployment behind reverse proxy
app.set('trust proxy', 1)

// Security middleware
app.use(helmet())

// Rate limiting with different tiers
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
})

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api/', generalLimiter)
app.use('/api/auth', strictLimiter)
app.use('/api/media', strictLimiter)

// CORS configuration
const getAllowedOrigins = () => {
  const baseOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://fusionx-nine.vercel.app'
  ]
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : []
  return [...baseOrigins, ...envOrigins]
}

// Initialize Socket.IO after getAllowedOrigins is defined
const io = new Server(server, {
  cors: {
    origin: [...getAllowedOrigins(), 'https://fusionx-nine.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Make io available globally
app.set('io', io)

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins()

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)

    // Always allow Vercel app
    if (origin === 'https://fusionx-nine.vercel.app') {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token']
}

// Standard middleware
app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // Handle preflight requests
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf)
      } catch (e) {
        res.status(400).json({ success: false, message: 'Invalid JSON' })
        throw new Error('Invalid JSON')
      }
    }
  })
)
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Input sanitization middleware
app.use((req, res, next) => {
  // Remove null bytes and control characters
  const sanitize = obj => {
    if (typeof obj === 'string') {
      return obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    }
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        obj[key] = sanitize(obj[key])
      }
    }
    return obj
  }

  if (req.body) req.body = sanitize(req.body)
  if (req.query) req.query = sanitize(req.query)
  if (req.params) req.params = sanitize(req.params)

  next()
})

// JWT-based CSRF protection
const jwt = require('jsonwebtoken')

const generateCSRFToken = () => {
  const payload = {
    type: 'csrf',
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex')
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })
}

const csrfProtection = (req, res, next) => {
  if (req.method === 'GET') {
    return next()
  }

  const token = req.headers['x-csrf-token']

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token required'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.type !== 'csrf') {
      throw new Error('Invalid token type')
    }
    next()
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    })
  }
}

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = generateCSRFToken()
  res.json({ csrfToken: token })
})

// Apply CSRF protection to state-changing routes
app.use('/api/posts', csrfProtection)
app.use('/api/users', csrfProtection)
app.use('/api/media', csrfProtection)
app.use('/api/categories', csrfProtection)
app.use('/api/tags', csrfProtection)
app.use('/api/comments', csrfProtection)
app.use('/api/settings', csrfProtection)
app.use('/api/sites', csrfProtection)
app.use('/api/subscriptions', csrfProtection)

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    const err = new Error('Request timeout')
    err.statusCode = 408
    next(err)
  })
  next()
})

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`)
  next()
})

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Connect to MongoDB and setup
const { connectDB, setupIndexes } = require('./utils/database')
connectDB()
  .then(async () => {
    // Setup database indexes
    await setupIndexes()

    // Initialize scheduled tasks after DB connection
    initScheduledTasks()
  })
  .catch(err => {
    logger.error('Could not connect to MongoDB', err)
    process.exit(1)
  })

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/tags', tagsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/', sitemapRoutes)
app.use('/api/backup', backupRoutes)
app.use('/api/pages', pagesRoutes)
app.use('/api/sites', sitesRoutes)
app.use('/api/subscriptions', subscriptionsRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() })
})

// Temporary cleanup endpoint (REMOVE AFTER USE)
app.get('/cleanup-lms', async (req, res) => {
  try {

    // Update users with student/instructor roles to subscriber
    await User.updateMany(
      { legacyRole: { $in: ['student', 'instructor'] } },
      { legacyRole: 'subscriber' }
    )

    // Remove student/instructor roles from database
    await Role.deleteMany({ name: { $in: ['student', 'instructor'] } })

    res.status(200).json({
      success: true,
      message: 'LMS cleanup completed'
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    })
  }
})

// Secure error handling middleware
app.use((err, req, res, next) => {
  // Log full error details server-side only
  logger.error(`${err.name}: ${err.message}\n${err.stack}`)

  const statusCode = err.statusCode || 500

  // Generic error messages for production
  const errorMessages = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error'
  }

  const message =
    process.env.NODE_ENV === 'production'
      ? errorMessages[statusCode] || 'An error occurred'
      : err.message

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' })
})

// Socket.IO connection handling
io.on('connection', socket => {
  console.log(`👤 User connected: ${socket.id}`)
  logger.info(`User connected: ${socket.id}`)

  // Join room based on user role
  socket.on('join_role', data => {
    const { role, userId } = data
    socket.join(role)
    socket.userId = userId
    socket.userRole = role

    console.log(`🏠 User ${socket.id} (${userId}) joined ${role} room`)
    console.log(
      `📊 Room ${role} now has ${
        io.sockets.adapter.rooms.get(role)?.size || 0
      } members`
    )

    logger.info(`User ${socket.id} (${userId}) joined ${role} room`)
  })

  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`)
    logger.info(`User disconnected: ${socket.id}`)
  })
})

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  logger.error('Unhandled Promise Rejection:', err)
})

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  logger.error('Uncaught Exception:', err)
  // Give the logger time to log the error before exiting
  setTimeout(() => {
    process.exit(1)
  }, 1000)
})
