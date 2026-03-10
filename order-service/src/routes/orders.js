/**
 * Order Routes - Order Service
 * Orchestrates orders between User and Product services
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const logger = require('../utils/logger');
const { getContext } = require('../utils/context');
const OrderModel = require('../db/models/Order');

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
        message: 'User ID is required (via authentication)',
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

    const userCheck = await callUserService(
      'GET',
      `/profile/${context.userId}/exists`,
      null,
      {
        'X-Request-ID': context.requestId,
        'X-User-ID': context.userId,
        'X-User-Role': context.userRole
      }
    );

    if (!userCheck.success || !userCheck.data?.success || !userCheck.data.data?.exists) {
      return res.status(userCheck.status || 404).json({
        success: false,
        message: 'User not found. Cannot create order.',
        code: 'USER_NOT_FOUND'
      });
    }

    // INTEGRATION POINT: Call Product Service to validate stock
    let totalPrice = 0;
    const validatedItems = [];

    for (const item of items) {
      try {
        // Call Product Service to check stock and get product info
        const response = await axios.get(
          `${PRODUCT_SERVICE_URL}/products/${item.productId}/availability?quantity=${item.quantity}`,
          {
            timeout: 5000,
            headers: {
              'X-Request-ID': context.requestId,
              'X-User-ID': context.userId
            }
          }
        );

        if (!response.data.success) {
          return res.status(400).json({
            success: false,
            message: `Product ${item.productId}: ${response.data.reason}`,
            code: 'INSUFFICIENT_STOCK'
          });
        }

        const productData = response.data.data;
        const itemTotal = productData.price * item.quantity;
        totalPrice += itemTotal;

        validatedItems.push({
          productId: item.productId,
          name: productData.name,
          quantity: item.quantity,
          price: productData.price,
          itemTotal
        });

      } catch (error) {
        logger.error(`Product Service call failed for ${item.productId}:`, error.message);
        return res.status(503).json({
          success: false,
          message: 'Product Service unavailable. Cannot validate order.',
          code: 'SERVICE_UNAVAILABLE'
        });
      }
    }

    // Create order in database
    const orderData = {
      userId: context.userId,
      items: validatedItems,
      totalPrice,
      shippingAddress: shippingAddress || '',
      notes: notes || ''
    };

    const order = await OrderModel.createOrder(orderData);

    for (const item of validatedItems) {
      const stockUpdate = await callProductService(
        'PUT',
        `/products/${item.productId}/stock`,
        {
          quantity: item.quantity,
          operation: 'decrease'
        },
        {
          'X-Request-ID': context.requestId,
          'X-User-ID': context.userId,
          'X-User-Role': context.userRole,
          'X-Service-Auth': 'order-service'
        }
      );

      if (!stockUpdate.success || !stockUpdate.data?.success) {
        await OrderModel.updateOrderStatus(order.orderId, 'failed');
        return res.status(stockUpdate.status || 503).json({
          success: false,
          message: `Stock reservation failed for product ${item.productId}`,
          code: 'STOCK_UPDATE_FAILED'
        });
      }
    }

    logger.info('Order created successfully', {
      orderId: order.orderId,
      userId: context.userId,
      itemCount: validatedItems.length,
      totalPrice,
      requestId: context.requestId
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.orderId,
        userId: order.userId,
        items: order.items,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt
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

    const order = await OrderModel.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Verify user owns order or is admin
    if (order.userId !== context.userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
        code: 'FORBIDDEN'
      });
    }

    logger.debug('Order details retrieved', { orderId, userId: context.userId, requestId: context.requestId });

    res.json({
      success: true,
      data: order
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
    const context = getContext(req);

    if (userId !== context.userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these orders',
        code: 'FORBIDDEN'
      });
    }

    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const orders = await OrderModel.getOrdersByUserId(userId, page, limit);

    logger.debug('User orders retrieved', { userId, requestId: context.requestId });

    res.json({
      success: true,
      data: orders
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
    const context = getContext(req);

    if (context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update order status',
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

    const allowedStatuses = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled', 'failed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
        code: 'VALIDATION_ERROR'
      });
    }

    const updatedOrder = await OrderModel.updateOrderStatus(orderId, status);
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    logger.info('Order status updated', { orderId, status, requestId: context.requestId });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
