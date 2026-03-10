/**
 * User Profile Routes
 * GET /profile/:userId - Get user profile
 * PUT /profile/:userId - Update profile
 * GET /profile/:userId/exists - Check if user exists
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { getUserId, getContext, hasRole } = require('../utils/context');
const UserModel = require('../db/models/User');

/**
 * GET /profile/:userId
 * Get user profile information
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const context = getContext(req);

    // Verify user can access this profile (own profile or admin)
    if (context.userId !== userId && !hasRole(req, 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this profile',
        code: 'FORBIDDEN'
      });
    }

    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    logger.debug('Profile retrieved', { userId, requestId: context.requestId });

    res.json({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /profile/:userId
 * Update user profile
 */
router.put('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, address } = req.body;
    const context = getContext(req);

    // Verify user can update this profile (own profile or admin)
    if (context.userId !== userId && !hasRole(req, 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile',
        code: 'FORBIDDEN'
      });
    }

    // Validate input
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: 'At least name or email is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const updatedUser = await UserModel.updateUser(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    logger.info('Profile updated', { userId, requestId: context.requestId });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /profile/:userId/exists
 * Check if user exists (used by Order Service)
 */
router.get('/:userId/exists', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const exists = await UserModel.userExists(userId);

    res.json({
      success: true,
      data: {
        exists,
        userId
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
