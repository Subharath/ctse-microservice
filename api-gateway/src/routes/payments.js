/**
 * Payment Routes - Proxy to Payment Service
 * Endpoints: /api/payments/*
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';

const callService = async (method, path, data = null, headers = {}, userId = null) => {
  try {
    const config = {
      method,
      url: `${PAYMENT_SERVICE_URL}${path}`,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        Authorization: headers.authorization,
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

router.post('/', async (req, res, next) => {
  try {
    const result = await callService('POST', '/payments', req.body, {
      authorization: req.headers.authorization
    }, req.user.id);

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Payment created successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/order/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const result = await callService('GET', `/payments/order/${orderId}`, null, {
      authorization: req.headers.authorization
    }, req.user.id);

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

router.get('/:paymentId', async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const result = await callService('GET', `/payments/${paymentId}`, null, {
      authorization: req.headers.authorization
    }, req.user.id);

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

router.put('/:paymentId/status', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update payment status',
        code: 'FORBIDDEN'
      });
    }

    const { paymentId } = req.params;
    const result = await callService('PUT', `/payments/${paymentId}/status`, req.body, {
      authorization: req.headers.authorization
    }, req.user.id);

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
