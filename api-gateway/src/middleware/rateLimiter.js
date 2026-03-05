/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting requests per IP
 */

const logger = require('../utils/logger');

// In-memory store for rate limits (simple implementation)
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // Max 100 requests per window

const cleanExpiredEntries = () => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
};

// Clean up every 5 minutes
setInterval(cleanExpiredEntries, 5 * 60 * 1000);

const rateLimiter = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(clientIp);

  if (!entry) {
    entry = {
      count: 0,
      resetTime: now
    };
    rateLimitStore.set(clientIp, entry);
  }

  // Reset if window expired
  if (now - entry.resetTime > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.resetTime = now;
  }

  // Increment request count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
    
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - entry.resetTime)) / 1000)
    });
  }

  // Add rate limit info to response headers
  res.set({
    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS,
    'X-RateLimit-Remaining': RATE_LIMIT_MAX_REQUESTS - entry.count,
    'X-RateLimit-Reset': new Date(entry.resetTime + RATE_LIMIT_WINDOW).toISOString()
  });

  next();
};

module.exports = rateLimiter;
