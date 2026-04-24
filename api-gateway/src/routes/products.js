/**
 * Product Routes - Proxy to Product Service
 * Endpoints: /api/products/*
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const getProxyHeaders = require('../utils/proxyHeaders');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

const callService = async (method, path, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${PRODUCT_SERVICE_URL}${path}`,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
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
 * GET /api/products
 * Get all products with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    
    let path = `/products?page=${page}&limit=${limit}`;
    if (search) path += `&search=${search}`;
    if (category) path += `&category=${category}`;

    const result = await callService('GET', path, null, getProxyHeaders(req));

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
 * GET /api/products/:productId
 * Get product details
 */
router.get('/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await callService('GET', `/products/${productId}`, null, getProxyHeaders(req));

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
 * GET /api/products/:productId/availability
 * Check product availability (used by Order Service)
 */
router.get('/:productId/availability', async (req, res, next) => {
  try {
    const { productId } = req.params;

    const { quantity = 1 } = req.query;
    const result = await callService('GET', `/products/${productId}/availability?quantity=${quantity}`, null, getProxyHeaders(req));

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
 * PUT /api/products/:productId/stock
 * Update product stock (used by Order Service)
 * Admin only
 */
router.put('/:productId/stock', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity, operation } = req.body;

    // Validate authorization - stock changes are gateway-admin only.
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update product stock',
        code: 'FORBIDDEN'
      });
    }

    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        message: 'quantity and operation are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await callService('PUT', `/products/${productId}/stock`, {
      quantity,
      operation
    }, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Stock updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
