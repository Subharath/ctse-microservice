/**
 * Request Logger Middleware
 * Tracks request information for monitoring and debugging
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.id = uuidv4();
  
  // Record request start time
  req.startTime = Date.now();

  // Log incoming request
  logger.info(`[${req.id}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous'
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    // Calculate response time
    const duration = Date.now() - req.startTime;
    
    // Log response
    logger.info(`[${req.id}] Response ${res.statusCode}`, {
      duration: `${duration}ms`,
      method: req.method,
      path: req.path,
      status: res.statusCode
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;
