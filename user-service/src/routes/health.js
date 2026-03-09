/**
 * Health Check Routes - Liveness and Readiness probes
 */

const express = require('express');
const router = express.Router();

/**
 * GET /health
 * Full health check including database connection
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Add database health check
    // const dbCheck = await checkDatabaseConnection();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'user-service',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      },
      runtime: {
        node: process.version.substring(1),
        platform: process.platform
      },
      database: {
        status: 'connected' // TODO: Check actual status
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /live
 * Liveness probe - Is service alive?
 */
router.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

/**
 * GET /ready
 * Readiness probe - Is service ready for traffic?
 */
router.get('/ready', (req, res) => {
  // TODO: Add readiness checks (database, dependencies)
  res.json({ status: 'ready' });
});

module.exports = router;
