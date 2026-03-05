/**
 * JWT Authentication Middleware
 * Validates JWT tokens and attaches user info to request
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  try {
    // Skip authentication for health check
    if (req.path === '/health') {
      return next();
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn(`Unauthorized request to ${req.method} ${req.path} - No token provided`);
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
        code: 'NO_TOKEN'
      });
    }

    // Parse "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn(`Invalid token format for ${req.method} ${req.path}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Authorization: Bearer <token>',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    req.userId = decoded.id || decoded.userId;
    
    logger.debug(`Auth success for user: ${req.userId}`);
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn(`Token expired for request ${req.method} ${req.path}`);
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
        expiresAt: error.expiredAt
      });
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Invalid token for request ${req.method} ${req.path}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    logger.error(`Auth middleware error: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = authMiddleware;
