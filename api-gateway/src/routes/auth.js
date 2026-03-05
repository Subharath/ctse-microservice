/**
 * Auth Routes - Proxy to User Service
 * Endpoints: /api/auth/*
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const logger = require('../utils/logger');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Helper function for service calls
const callService = async (method, path, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${USER_SERVICE_URL}${path}`,
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
    logger.error(`Service call failed to ${USER_SERVICE_URL}${path}:`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    return {
      success: false,
      status: error.response?.status || 503,
      data: error.response?.data || { message: 'Service unavailable' }
    };
  }
};

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'email, password, and name are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Call User Service
    const result = await callService('POST', '/users/register', {
      email,
      password,
      name
    });

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'User registered successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Call User Service
    const result = await callService('POST', '/users/login', {
      email,
      password
    });

    if (!result.success) {
      return res.status(result.status).json(result.data);
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Login successful'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'refreshToken is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Call User Service
    const result = await callService('POST', '/users/refresh', {
      refreshToken
    });

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
