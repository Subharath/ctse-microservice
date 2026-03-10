/**
 * User Routes - Proxy to User Service
 * Endpoints: /api/users/*
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const getProxyHeaders = require('../utils/proxyHeaders');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

const callService = async (method, path, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${USER_SERVICE_URL}${path}`,
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
 * GET /api/users/:userId
 * Get user profile
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user',
        code: 'FORBIDDEN'
      });
    }

    const result = await callService('GET', `/profile/${userId}`, null, getProxyHeaders(req));

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
 * PUT /api/users/:userId
 * Update user profile
 */
router.put('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;

    // Validate authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
        code: 'FORBIDDEN'
      });
    }

    const result = await callService('PUT', `/profile/${userId}`, {
      name,
      email
    }, getProxyHeaders(req));

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({
      success: true,
      data: result.data,
      message: 'User updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:userId/exists
 * Check if user exists (used by Order Service)
 */
router.get('/:userId/exists', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await callService('GET', `/profile/${userId}/exists`, null, getProxyHeaders(req));

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

module.exports = router;
