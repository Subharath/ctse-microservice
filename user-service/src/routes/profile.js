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

    logger.debug('Profile requested', { userId, requestId: context.requestId });

    res.json({
      success: true,
      data: {
        // TODO: Return user profile from MongoDB
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

    logger.info('Profile update requested', { userId, requestId: context.requestId });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        // TODO: Return updated profile from MongoDB
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

    // TODO: Implement existence check
    // - Query MongoDB for user
    // - Return exists: true/false

    res.json({
      success: true,
      data: {
        exists: true,
        userId
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
