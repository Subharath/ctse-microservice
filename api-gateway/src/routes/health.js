/**
 * Health Check Routes
 * Endpoint: /health
 * Purpose: Monitor API Gateway health and dependencies
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const logger = require('../utils/logger');

// Health check endpoint with full status
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check backend services health
    const services = {
      userService: {
        url: process.env.USER_SERVICE_URL,
        status: 'unknown',
        responseTime: null,
        error: null
      },
      productService: {
        url: process.env.PRODUCT_SERVICE_URL,
        status: 'unknown',
        responseTime: null,
        error: null
      },
      orderService: {
        url: process.env.ORDER_SERVICE_URL,
        status: 'unknown',
        responseTime: null,
        error: null
      }
    };

    // Check each service in parallel
    const serviceChecks = Object.entries(services).map(async ([key, service]) => {
      try {
        const checkStart = Date.now();
        const response = await axios.get(`${service.url}/health`, {
          timeout: 3000
        });
        const responseTime = Date.now() - checkStart;
        
        services[key].status = response.status === 200 ? 'healthy' : 'unhealthy';
        services[key].responseTime = responseTime;
      } catch (error) {
        services[key].status = 'unhealthy';
        services[key].error = error.message;
      }
    });

    await Promise.all(serviceChecks);

    const gatewayResponseTime = Date.now() - startTime;
    
    // Determine overall health
    const overallHealth = Object.values(services).every(s => s.status === 'healthy')
      ? 'healthy'
      : 'degraded';

    const healthResponse = {
      status: overallHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${gatewayResponseTime}ms`,
      gateway: {
        name: 'API Gateway',
        version: process.env.npm_package_version || '1.0.0',
        runtime: process.version,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      },
      services: services,
      environment: process.env.NODE_ENV || 'development'
    };

    // Log health check
    if (overallHealth === 'healthy') {
      logger.debug('Health check: All systems operational');
    } else {
      logger.warn('Health check: Service degradation detected', {
        degradedServices: Object.entries(services)
          .filter(([_, s]) => s.status !== 'healthy')
          .map(([k, _]) => k)
      });
    }

    res.json(healthResponse);

  } catch (error) {
    logger.error('Health check failed:', error.message);
    res.status(500).json({
      status: 'unhealthy',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe (is the gateway running?)
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe (is the gateway ready to serve traffic?)
router.get('/ready', async (req, res) => {
  try {
    // Check if critical config is present
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      reason: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
