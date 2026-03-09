/**
 * Error Handler Middleware - Global error handling for Payment Service
 */

const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  const code = error.code || 'INTERNAL_ERROR';

  logger[statusCode >= 500 ? 'error' : 'warn'](`[${requestId}] ${message}`, {
    statusCode,
    code,
    path: req.path,
    method: req.method,
    userId: req.headers['x-user-id'],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });

  const response = {
    success: false,
    message,
    code,
    requestId,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
