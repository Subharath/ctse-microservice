/**
 * Authentication Routes - Register, Login, Refresh
 * POST /auth/register - Create new user
 * POST /auth/login - Authenticate user
 * POST /auth/refresh - Refresh token
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const UserModel = require('../db/models/User');

const buildAuthPayload = (user) => ({
  id: user.userId,
  userId: user.userId,
  email: user.email,
  role: user.role
});

const signAccessToken = (user) => jwt.sign(
  buildAuthPayload(user),
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRY || '7d' }
);

const signRefreshToken = (user) => jwt.sign(
  buildAuthPayload(user),
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

/**
 * POST /auth/register
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email, and password are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await UserModel.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        code: 'USER_EXISTS'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    logger.info('User registration attempted', { email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt
        },
        token: accessToken,
        refreshToken
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    logger.info('User login attempted', { email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt
        },
        token: accessToken,
        refreshToken
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/refresh
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

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await UserModel.getUserById(decoded.userId || decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found for refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const accessToken = signAccessToken(user);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        token: accessToken
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
