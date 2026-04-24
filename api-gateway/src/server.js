const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()

const authMiddleware = require('./middleware/auth')
const contextInjector = require('./middleware/contextInjector')
const errorHandler = require('./middleware/errorHandler')
const requestLogger = require('./middleware/requestLogger')
const rateLimiter = require('./middleware/rateLimiter')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const productRoutes = require('./routes/products')
const orderRoutes = require('./routes/orders')
const paymentRoutes = require('./routes/payments')
const cartRoutes = require('./routes/carts')
const healthRoutes = require('./routes/health')

const app = express()
const PORT = process.env.PORT || 8000
const NODE_ENV = process.env.NODE_ENV || 'development'
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.set('trust proxy', 1)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Origin not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev', {
  skip: (req) => req.path === '/health'
}))
app.use(requestLogger)
app.use(rateLimiter)

app.use('/health', healthRoutes)
app.use('/api/auth', authRoutes)

app.use(authMiddleware)
app.use(contextInjector)

app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/carts', cartRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
  })
})

app.use(errorHandler)

const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`API Gateway ready at http://localhost:${PORT}`)
  })

  process.on('SIGTERM', () => {
    server.close(() => {
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    server.close(() => {
      process.exit(0)
    })
  })
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
  process.exit(1)
})

startServer()

module.exports = app
