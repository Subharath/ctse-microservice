/**
 * Request Logger Middleware - Track requests with unique IDs
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const userId = req.headers['x-user-id'] || 'anonymous';
  const startTime = Date.now();

  logger.info(`→ ${req.method} ${req.path}`, {
    requestId,
    ip,
    userId,
    userAgent: userAgent?.substring(0, 50)
  });

  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    logger.info(`← ${req.method} ${req.path} [${res.statusCode}]`, {
      requestId,
      duration: `${duration}ms`,
      statusCode: res.statusCode
    });
    return originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;
