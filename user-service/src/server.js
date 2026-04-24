require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const requestLogger = require('./middleware/requestLogger')
const trustedProxy = require('./middleware/trustedProxy')
const errorHandler = require('./middleware/errorHandler')
const healthRoutes = require('./routes/health')
const authRoutes = require('./routes/auth')
const profileRoutes = require('./routes/profile')
const db = require('./db/db')
const UserModel = require('./db/models/User')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173'
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(requestLogger)
app.use(trustedProxy)

app.use('/health', healthRoutes)
app.use('/auth', authRoutes)
app.use('/profile', profileRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND'
  })
})

app.use(errorHandler)

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} signal received: closing HTTP server`)
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
  process.exit(1)
})

const startServer = async () => {
  try {
    await db.connect()
    await UserModel.initializeCollection()

    app.listen(PORT, () => {
      console.log(`User Service ready at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start user service:', error.message)
    process.exit(1)
  }
}

startServer()

module.exports = app
