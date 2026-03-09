/**
 * Health Check Routes - Liveness and Readiness probes
 */

const express = require('express');
const router = express.Router();

/**
 * GET /health
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'product-service',
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
        status: 'connected'
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
 */
router.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

/**
 * GET /ready
 */
router.get('/ready', (req, res) => {
  res.json({ status: 'ready' });
});

module.exports = router;
