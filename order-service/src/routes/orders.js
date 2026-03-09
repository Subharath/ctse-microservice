/**
 * Order Routes - Order Service
 * Orchestrates orders between User and Product services
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const logger = require('../utils/logger');
const { getContext } = require('../utils/context');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

/**
 * Helper: Call User Service
 */
const callUserService = async (method, path, data = null, headers = {}) => {
  try {
    const response = await axios({
      method,
      url: `${USER_SERVICE_URL}${path}`,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(data && { data })
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 503,
      data: error.response?.data || { message: 'User Service unavailable' }
    };
  }
};

/**
 * Helper: Call Product Service
 */
const callProductService = async (method, path, data = null, headers = {}) => {
  try {
    const response = await axios({
      method,
      url: `${PRODUCT_SERVICE_URL}${path}`,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(data && { data })
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 503,
      data: error.response?.data || { message: 'Product Service unavailable' }
    };
  }
};

/**
 * POST /orders
 * Create new order with orchestration
 * Flow: Validate user → Check product stock → Save order
 */
router.post('/', async (req, res, next) => {
  try {
    const context = getContext(req);
    const { items, shippingAddress, notes } = req.body;

    if (context.userId === 'anonymous') {
      return res.status(401).json({
        success: false,
        message: 'User ID is required',
        code: 'UNAUTHORIZED'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required and must not be empty',
        code: 'VALIDATION_ERROR'
      });
    }

    logger.info('Order creation initiated', { userId: context.userId, itemCount: items.length, requestId: context.requestId });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        // TODO: Return created order
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /orders/:orderId
 * Get order details
 */
router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const context = getContext(req);

    logger.debug('Order details requested', { orderId, userId: context.userId, requestId: context.requestId });

    res.json({
      success: true,
      data: {
        // TODO: Return order details
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /orders/user/:userId
 * Get all orders for user
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // TODO: Implement user orders retrieval
    // - Get orders from MongoDB by userId
    // - Return orders array

    logger.debug('User orders retrieved', { userId });

    res.json({
      success: true,
      data: {
        // TODO: Return orders array
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /orders/:orderId/status
 * Update order status
 */
router.put('/:orderId/status', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // TODO: Implement status update
    // - Validate status value
    // - Update order in MongoDB
    // - Log status change

    logger.info('Order status updated', { orderId, status });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        // TODO: Return updated order
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
