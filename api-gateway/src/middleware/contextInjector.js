/**
 * Context Injector Middleware
 * 
 * Purpose:
 * Extracts authenticated user info from JWT (already verified by authMiddleware)
 * and injects it into request headers for downstream service consumption.
 * This eliminates the need for each service to re-validate the JWT.
 * 
 * Headers injected:
 * - X-User-ID: Unique user identifier
 * - X-User-Email: User email address
 * - X-User-Role: User role (admin, user, etc.)
 * - X-Request-ID: Unique request identifier for distributed tracing
 * 
 * Usage: Applied to protected routes in gateway before proxying to services
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const contextInjector = (req, res, next) => {
  try {
    // Generate unique request ID (or use existing one for tracing)
    const requestId = req.requestId || req.id || uuidv4();
    req.id = requestId;
    req.requestId = requestId;

    // Extract user context from auth middleware (req.user is set by authMiddleware)
    if (req.user) {
      // Inject user context as headers for downstream services
      req.headers['x-user-id'] = req.user.id || req.user.userId || 'anonymous';
      req.headers['x-user-email'] = req.user.email || '';
      req.headers['x-user-role'] = req.user.role || 'user';
      req.headers['x-request-id'] = requestId;

      logger.debug(`Context injected for user: ${req.headers['x-user-id']}, requestId: ${requestId}`);
    } else {
      // No authenticated user (public endpoint or auth skipped)
      req.headers['x-user-id'] = 'anonymous';
      req.headers['x-user-role'] = 'public';
      req.headers['x-request-id'] = requestId;

      logger.debug(`Context injected for public request, requestId: ${requestId}`);
    }

    next();
  } catch (error) {
    logger.error(`Context injector error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error during context injection',
      requestId: req.id
    });
  }
};

module.exports = contextInjector;
