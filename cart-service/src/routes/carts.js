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

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

const callProductService = async (method, path) => {
  try {
    const response = await axios({
      method,
      url: `${PRODUCT_SERVICE_URL}${path}`,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      data: error.response?.data || { message: 'Product Service unavailable' }
    };
  }
};

router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // TODO: Fetch cart from MongoDB by userId
    logger.debug('Cart requested', { userId });

    res.json({
      success: true,
      data: {
        userId,
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:userId/items', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate product availability before adding to cart.
    const availability = await callProductService('GET', `/products/${productId}/availability`);
    if (!availability.success) {
      return res.status(503).json(availability.data);
    }

    // TODO: Persist item in MongoDB cart document.
    logger.info('Cart item add requested', { userId, productId, quantity });

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: {
        userId,
        productId,
        quantity
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:userId/items/:productId', async (req, res, next) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be greater than 0',
        code: 'VALIDATION_ERROR'
      });
    }

    // TODO: Update cart item quantity in MongoDB.
    logger.info('Cart item update requested', { userId, productId, quantity });

    res.json({
      success: true,
      message: 'Cart item updated',
      data: {
        userId,
        productId,
        quantity
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:userId/items/:productId', async (req, res, next) => {
  try {
    const { userId, productId } = req.params;

    // TODO: Remove item from MongoDB cart.
    logger.info('Cart item remove requested', { userId, productId });

    res.json({
      success: true,
      message: 'Cart item removed',
      data: { userId, productId }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // TODO: Clear entire cart in MongoDB.
    logger.info('Cart clear requested', { userId });

    res.json({
      success: true,
      message: 'Cart cleared',
      data: { userId }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
