/**
 * Order Routes - Proxy to Order Service
 * Endpoints: /api/orders/*
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const getProxyHeaders = require('../utils/proxyHeaders');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

const callService = async (method, path, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${ORDER_SERVICE_URL}${path}`,
      timeout: 5000,
      headers
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };

  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 503,
      data: error.response?.data || { message: 'Service unavailable' }
    };
  }
};

/**
 * POST /api/orders
 * Create new order
 */
router.post('/', async (req, res, next) => {
  try {
    const { items, shippingAddress, notes } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required and must not be empty',
        code: 'VALIDATION_ERROR'
      });
    }

    // Call Order Service with authenticated user and JWT
    const result = await callService('POST', '/orders', {
      items,
      shippingAddress,
      notes
    }, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Order created successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:orderId
 * Get order details
 */
router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const result = await callService('GET', `/orders/${orderId}`, null, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/user/me
 * Get current user's orders
 */
router.get('/user/me', async (req, res, next) => {
  try {
    const result = await callService('GET', `/orders/user/${req.user.id}`, null, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/user/:userId
 * Get user's orders (admin or self)
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these orders',
        code: 'FORBIDDEN'
      });
    }

    const result = await callService('GET', `/orders/user/${userId}`, null, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/orders/:orderId/status
 * Update order status (admin only)
 */
router.put('/:orderId/status', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate authorization - admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update order status',
        code: 'FORBIDDEN'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await callService('PUT', `/orders/${orderId}/status`, {
      status
    }, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
