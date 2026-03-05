/**
 * Global Error Handler Middleware
 * Handles all errors and returns consistent response format
 */

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const requestId = req.id || 'unknown';
  
  // Default error status and message
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';

  // Determine error type and log accordingly
  if (status >= 500) {
    logger.error(`[${requestId}] Server Error:`, {
      status,
      message,
      code,
      path: req.path,
      method: req.method,
      stack: err.stack
    });
  } else if (status >= 400) {
    logger.warn(`[${requestId}] Client Error: ${message} (${status})`);
  }

  // Send error response
  res.status(status).json({
    success: false,
    message,
    code,
    requestId,
    timestamp,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
