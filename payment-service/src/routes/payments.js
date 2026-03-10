/**
 * Payment Routes
 * POST /payments - Create payment
 * GET /payments/:paymentId - Get payment details
 * GET /payments/order/:orderId - Get payment by order
 * PUT /payments/:paymentId/status - Update payment status
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const logger = require('../utils/logger');
const { getContext } = require('../utils/context');
const PaymentModel = require('../db/models/Payment');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

const callOrderService = async (req, method, path, data = null) => {
  try {
    const response = await axios({
      method,
      url: `${ORDER_SERVICE_URL}${path}`,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': req.headers['x-user-id'],
        'X-User-Email': req.headers['x-user-email'],
        'X-User-Role': req.headers['x-user-role'],
        'X-Request-ID': req.headers['x-request-id']
      },
      ...(data && { data })
    });

    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 503,
      data: error.response?.data || { message: 'Order Service unavailable' }
    };
  }
};

router.post('/', async (req, res, next) => {
  try {
    const context = getContext(req);
    const { orderId, amount, currency = 'USD', method } = req.body;

    if (context.userId === 'anonymous' || !orderId || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'User (via auth), orderId, amount, and method are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const orderLookup = await callOrderService(req, 'GET', `/orders/${orderId}`);
    if (!orderLookup.success || !orderLookup.data?.success) {
      return res.status(orderLookup.status).json({
        success: false,
        message: 'Order verification failed before payment creation',
        code: 'ORDER_LOOKUP_FAILED'
      });
    }

    const order = orderLookup.data.data;
    if (Number(order.totalPrice) !== Number(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must match order total',
        code: 'AMOUNT_MISMATCH'
      });
    }

    const existingPayment = await PaymentModel.getPaymentByOrderId(orderId);
    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: 'Payment already exists for this order',
        code: 'PAYMENT_EXISTS'
      });
    }

    const payment = await PaymentModel.createPayment({
      userId: context.userId,
      orderId,
      amount: Number(amount),
      currency,
      method,
      status: 'pending'
    });

    logger.info('Payment creation requested', { userId: context.userId, orderId, amount, method, requestId: context.requestId });

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment.paymentId,
        userId: payment.userId,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/order/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const context = getContext(req);
    const payment = await PaymentModel.getPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found for order',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    if (payment.userId !== context.userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this payment',
        code: 'FORBIDDEN'
      });
    }

    logger.debug('Payment lookup by order', { orderId, userId: context.userId, requestId: context.requestId });

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:paymentId', async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const context = getContext(req);
    const payment = await PaymentModel.getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    if (payment.userId !== context.userId && context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this payment',
        code: 'FORBIDDEN'
      });
    }

    logger.debug('Payment lookup', { paymentId, userId: context.userId, requestId: context.requestId });

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:paymentId/status', async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;
    const context = getContext(req);

    if (context.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update payment status',
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

    const updatedPayment = await PaymentModel.updatePaymentStatus(paymentId, status);
    if (!updatedPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    logger.info('Payment status update requested', { paymentId, status, requestId: context.requestId });

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
