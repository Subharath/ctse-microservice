/**
 * Error Handler Middleware - Global error handling for User Service
 */

const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  const timestamp = new Date().toISOString();

  // Default error
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel](`[${requestId}] ${error.message}`, {
    statusCode,
    code,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });

  // Response
  const response = {
    success: false,
    message,
    code,
    requestId,
    timestamp
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
