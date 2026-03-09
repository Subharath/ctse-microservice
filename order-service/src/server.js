/**
 * Order Service - Server
 * Port: 3003
 * Handles: Order creation, order management, orchestration with User and Product services
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3003;

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
app.use('/orders', ordersRoutes);

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
║                   ORDER SERVICE                            ║
╚════════════════════════════════════════════════════════════╝
  
🚀 Server Starting...
  ├─ Port: ${PORT}
  ├─ Environment: ${process.env.NODE_ENV || 'development'}
  ├─ MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/order_db'}
  └─ Timestamp: ${new Date().toISOString()}
  
📝 Documentation: See ../ for detailed guides
  `;
  
  console.log(banner);
};

app.listen(PORT, () => {
  startServer();
  console.log(`✅ Order Service ready at http://localhost:${PORT}\n`);
});

module.exports = app;
