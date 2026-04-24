/**
 * Cart Routes
 * GET /carts/:userId - Get cart
 * POST /carts/:userId/items - Add item
 * PUT /carts/:userId/items/:productId - Update item quantity
 * DELETE /carts/:userId/items/:productId - Remove item
 * DELETE /carts/:userId - Clear cart
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const logger = require('../utils/logger');
const { getContext } = require('../utils/context');
const CartModel = require('../db/models/Cart');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'internal-local-secret';

const callProductService = async (req, method, path) => {
  try {
    const response = await axios({
      method,
      url: `${PRODUCT_SERVICE_URL}${path}`,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': req.headers['x-user-id'],
        'X-User-Role': req.headers['x-user-role'],
        'X-Request-ID': req.headers['x-request-id'],
        'X-Internal-Service-Name': 'cart-service',
        'X-Internal-Service-Secret': INTERNAL_SERVICE_SECRET
      }
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

router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const context = getContext(req);

    // Verify user can access their own cart (or is admin)
    if (context.userId !== userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this cart',
        code: 'FORBIDDEN'
      });
    }

    logger.debug('Cart requested', { userId, requestId: context.requestId });
    const cart = await CartModel.getOrCreateCart(userId);

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:userId/items', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1 } = req.body;
    const context = getContext(req);

    // Verify user can modify their own cart
    if (context.userId !== userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this cart',
        code: 'FORBIDDEN'
      });
    }

    if (!productId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'productId is required and quantity must be greater than 0',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate product availability before adding to cart
    const availability = await callProductService(req, 'GET', `/products/${productId}/availability?quantity=${quantity}`);
    if (!availability.success || !availability.data?.success) {
      return res.status(availability.status || 503).json(availability.data);
    }

    const product = availability.data.data;
    const cart = await CartModel.addItem(userId, {
      productId,
      name: product.name,
      price: product.price,
      quantity
    });

    logger.info('Cart item add requested', { userId, productId, quantity, requestId: context.requestId });

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:userId/items/:productId', async (req, res, next) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;
    const context = getContext(req);

    // Verify user can modify their own cart
    if (context.userId !== userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this cart',
        code: 'FORBIDDEN'
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be greater than 0',
        code: 'VALIDATION_ERROR'
      });
    }

    const availability = await callProductService(req, 'GET', `/products/${productId}/availability?quantity=${quantity}`);
    if (!availability.success || !availability.data?.success) {
      return res.status(availability.status || 503).json(availability.data);
    }

    const cart = await CartModel.updateItemQuantity(userId, productId, quantity);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
        code: 'CART_ITEM_NOT_FOUND'
      });
    }

    logger.info('Cart item update requested', { userId, productId, quantity, requestId: context.requestId });

    res.json({
      success: true,
      message: 'Cart item updated',
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:userId/items/:productId', async (req, res, next) => {
  try {
    const { userId, productId } = req.params;
    const context = getContext(req);

    // Verify user can modify their own cart
    if (context.userId !== userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this cart',
        code: 'FORBIDDEN'
      });
    }

    const cart = await CartModel.removeItem(userId, productId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
        code: 'CART_ITEM_NOT_FOUND'
      });
    }

    logger.info('Cart item remove requested', { userId, productId, requestId: context.requestId });

    res.json({
      success: true,
      message: 'Cart item removed',
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const context = getContext(req);

    if (context.userId !== userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this cart',
        code: 'FORBIDDEN'
      });
    }

    const cart = await CartModel.clearCart(userId);
    logger.info('Cart clear requested', { userId, requestId: context.requestId });

    res.json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
