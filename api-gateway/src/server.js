/**
 * API Gateway - Central Entry Point
 * Role: Request routing, authentication, error handling, logging
 * Version: 1.0.0
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');

// Route handlers
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const healthRoutes = require('./routes/health');

const app = express();

// ===== CONFIGURATION =====
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===== MIDDLEWARE - REQUEST PROCESSING =====

// 1. CORS - Allow cross-origin requests
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. BODY PARSING - Parse JSON & URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. REQUEST LOGGING - Log all requests (Morgan for production logging)
if (NODE_ENV === 'production') {
  app.use(morgan('combined', { skip: (req) => req.path === '/health' }));
} else {
  app.use(morgan('dev', { skip: (req) => req.path === '/health' }));
}

// 4. CUSTOM REQUEST LOGGING - Track requests internally
app.use(requestLogger);

// 5. RATE LIMITING - Prevent abuse
app.use(rateLimiter);

// ===== ROUTES - NO AUTHENTICATION NEEDED =====

// Health check endpoint (critical for load balancers & monitoring)
app.use('/health', healthRoutes);

// Public auth routes (login, register)
app.use('/api/auth', authRoutes);

// ===== MIDDLEWARE - AUTHENTICATION =====
// All routes below require JWT token
app.use(authMiddleware);

// ===== ROUTES - AUTHENTICATED =====

// User routes (USER SERVICE)
app.use('/api/users', userRoutes);

// Product routes (PRODUCT SERVICE)
app.use('/api/products', productRoutes);

// Order routes (ORDER SERVICE)
app.use('/api/orders', orderRoutes);

// ===== ERROR HANDLING =====

// 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler (MUST be last)
app.use(errorHandler);

// ===== SERVER STARTUP =====

const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`
      ╔════════════════════════════════════════╗
      ║     🔴 API GATEWAY STARTED             ║
      ║                                        ║
      ║  ✓ Port: ${PORT}                           ║
      ║  ✓ Environment: ${NODE_ENV.toUpperCase()}         ║
      ║  ✓ Timestamp: ${new Date().toISOString()}  ║
      ║                                        ║
      ║  Health: http://localhost:${PORT}/health      ║
      ║  API Docs: http://localhost:${PORT}/docs     ║
      ╚════════════════════════════════════════╝
    `);

    // Log service URLs
    console.log('\n📍 Backend Services:');
    console.log(`   User Service: ${process.env.USER_SERVICE_URL}`);
    console.log(`   Product Service: ${process.env.PRODUCT_SERVICE_URL}`);
    console.log(`   Order Service: ${process.env.ORDER_SERVICE_URL}`);
    console.log(`\n⚙️  Configuration:`);
    console.log(`   CORS Origin: ${process.env.CORS_ORIGIN || 'All origins (*)'}`);
    console.log(`   JWT Secret: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Not set'}`);
    console.log(`   Database: ${process.env.MONGODB_URI ? '✓ Set' : '✗ Not set'}\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('✓ HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('✓ HTTP server closed');
      process.exit(0);
    });
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
