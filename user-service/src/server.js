/**
 * User Service - Server
 * Port: 3001
 * Handles: User registration, authentication, profile management
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173'
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND'
  });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} signal received: closing HTTP server`);
  
  // Close server and cleanup
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Startup
const startServer = () => {
  const banner = `
╔════════════════════════════════════════════════════════════╗
║                   USER SERVICE                             ║
╚════════════════════════════════════════════════════════════╝
  
🚀 Server Starting...
  ├─ Port: ${PORT}
  ├─ Environment: ${process.env.NODE_ENV || 'development'}
  ├─ MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/user_db'}
  └─ Timestamp: ${new Date().toISOString()}
  
📝 Documentation: See ../ for detailed guides
  `;
  
  console.log(banner);
};

app.listen(PORT, () => {
  startServer();
  console.log(`✅ User Service ready at http://localhost:${PORT}\n`);
});

module.exports = app;
