/**
 * Cart Routes - Proxy to Cart Service
 * Endpoints: /api/carts/*
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const getProxyHeaders = require('../utils/proxyHeaders');

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3005';

const callService = async (method, path, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${CART_SERVICE_URL}${path}`,
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

const validateCartAccess = (req, res) => {
  const { userId } = req.params;
  if (req.user.id !== userId && req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Not authorized to access this cart',
      code: 'FORBIDDEN'
    });
    return false;
  }
  return true;
};

router.get('/:userId', async (req, res, next) => {
  try {
    if (!validateCartAccess(req, res)) return;

    const { userId } = req.params;
    const result = await callService('GET', `/carts/${userId}`, null, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
});

router.post('/:userId/items', async (req, res, next) => {
  try {
    if (!validateCartAccess(req, res)) return;

    const { userId } = req.params;
    const result = await callService('POST', `/carts/${userId}/items`, req.body, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.status(201).json({ success: true, data: result.data, message: 'Cart item added successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/:userId/items/:productId', async (req, res, next) => {
  try {
    if (!validateCartAccess(req, res)) return;

    const { userId, productId } = req.params;
    const result = await callService('PUT', `/carts/${userId}/items/${productId}`, req.body, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({ success: true, data: result.data, message: 'Cart item updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:userId/items/:productId', async (req, res, next) => {
  try {
    if (!validateCartAccess(req, res)) return;

    const { userId, productId } = req.params;
    const result = await callService('DELETE', `/carts/${userId}/items/${productId}`, null, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({ success: true, data: result.data, message: 'Cart item removed successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:userId', async (req, res, next) => {
  try {
    if (!validateCartAccess(req, res)) return;

    const { userId } = req.params;
    const result = await callService('DELETE', `/carts/${userId}`, null, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({ success: true, data: result.data, message: 'Cart cleared successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
