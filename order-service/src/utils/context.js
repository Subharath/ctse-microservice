/**
 * Context Helper Utility
 * 
 * Purpose:
 * Provides a simple way for services to extract user context from request headers.
 * Headers are injected by the API Gateway (contextInjector middleware).
 * Services trust these headers and do NOT need to re-validate JWT.
 * 
 * This eliminates redundant JWT validation across services and reduces latency.
 * 
 * Usage:
 * const context = getContext(req);
 * console.log(context.userId, context.userRole, context.requestId);
 */

const getContext = (req) => {
  return {
    userId: req.headers['x-user-id'] || 'anonymous',
    userEmail: req.headers['x-user-email'] || '',
    userRole: req.headers['x-user-role'] || 'public',
    requestId: req.headers['x-request-id'] || 'unknown'
  };
};

/**
 * Extract user ID from request
 * Shorthand helper for common use case
 */
const getUserId = (req) => {
  return req.headers['x-user-id'] || 'anonymous';
};

/**
 * Extract request ID for distributed tracing
 * Shorthand helper for common use case
 */
const getRequestId = (req) => {
  return req.headers['x-request-id'] || 'unknown';
};

/**
 * Check if user has a specific role
 * Helper for role-based access control
 */
const hasRole = (req, role) => {
  const userRole = req.headers['x-user-role'] || 'public';
  return userRole === role || userRole === 'admin';
};

module.exports = {
  getContext,
  getUserId,
  getRequestId,
  hasRole
};
