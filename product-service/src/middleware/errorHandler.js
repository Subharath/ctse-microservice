/**
 * Error Handler Middleware - Global error handling for Product Service
 */

const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  const timestamp = new Date().toISOString();

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel](`[${requestId}] ${error.message}`, {
    statusCode,
    code,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });

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
