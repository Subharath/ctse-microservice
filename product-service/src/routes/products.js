/**
 * Product Routes
 * GET /products - List all products
 * GET /products/:productId - Get product details
 * GET /products/:productId/availability - Check stock
 * PUT /products/:productId/stock - Update inventory
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { getContext } = require('../utils/context');
const ProductModel = require('../db/models/Product');

/**
 * GET /products
 * List products with pagination and filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const context = getContext(req);

    const result = await ProductModel.getProducts(parseInt(page), parseInt(limit), category);

    logger.debug('Products listed', { page, limit, userId: context.userId, requestId: context.requestId });

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /products/:productId
 * Get single product details
 */
router.get('/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const context = getContext(req);

    const product = await ProductModel.getProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    logger.debug('Product details requested', { productId, userId: context.userId, requestId: context.requestId });

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /products/:productId/availability
 * Check product stock and availability
 */
router.get('/:productId/availability', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.query;
    const context = getContext(req);

    const availability = await ProductModel.checkStock(productId, parseInt(quantity));

    logger.debug('Product availability checked', { productId, requestId: context.requestId });

    res.json({
      success: availability.available,
      data: availability.available ? availability.data : null,
      in_stock: availability.available,
      reason: availability.reason
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /products/:productId/stock
 * Update product stock (admin only or service-to-service)
 */
router.put('/:productId/stock', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity, operation } = req.body;
    const context = getContext(req);

    if (!quantity || !operation || !['increase', 'decrease'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'quantity and operation (increase/decrease) are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const quantityChange = operation === 'increase' ? quantity : -quantity;
    const updated = await ProductModel.updateStock(productId, quantityChange);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    logger.info('Stock update requested', { productId, quantity, operation, requestId: context.requestId });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        productId: updated.productId,
        newStock: updated.stock
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
