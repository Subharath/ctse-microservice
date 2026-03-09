/**
 * Request Logger Middleware - Track requests with unique IDs
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;

  // Extract client info
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const userId = req.headers['x-user-id'] || 'anonymous';

  // Capture start time
  const startTime = Date.now();

  // Log request
  logger.info(`→ ${req.method} ${req.path}`, {
    requestId,
    ip,
    userId,
    userAgent: userAgent?.substring(0, 50)
  });

  // Intercept response to log details
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log response
    logger.info(`← ${req.method} ${req.path} [${statusCode}]`, {
      requestId,
      duration: `${duration}ms`,
      statusCode
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;
