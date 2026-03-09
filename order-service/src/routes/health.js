/**
 * Health Check Routes - Liveness and Readiness probes
 * Order Service checks dependency on User and Product services
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

/**
 * GET /health
 * Full health check with dependent services
 */
router.get('/', async (req, res) => {
  try {
    // Check dependent services in parallel
    const [userServiceCheck, productServiceCheck] = await Promise.allSettled([
      axios.get(`${USER_SERVICE_URL}/health`, { timeout: 3000 }),
      axios.get(`${PRODUCT_SERVICE_URL}/health`, { timeout: 3000 })
    ]);

    const serviceStatus = {
      user_service: {
        status: userServiceCheck.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        responseTime: userServiceCheck.value?.data?.uptime || null
      },
      product_service: {
        status: productServiceCheck.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        responseTime: productServiceCheck.value?.data?.uptime || null
      }
    };

    const allHealthy = Object.values(serviceStatus).every(s => s.status === 'healthy');

    res.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'order-service',
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
      dependencies: serviceStatus
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
 * Liveness probe
 */
router.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

/**
 * GET /ready
 * Readiness probe
 */
router.get('/ready', (req, res) => {
  // TODO: Check database and service dependencies
  res.json({ status: 'ready' });
});

module.exports = router;
