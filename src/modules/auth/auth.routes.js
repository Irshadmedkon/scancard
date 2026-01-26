const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const validateRequest = require('../../middleware/validateRequest');

/**
 * Register new user
 * POST /api/v1/auth/register
 */
router.post('/register', validateRequest('register'), authController.register);

/**
 * Login user
 * POST /api/v1/auth/login
 */
router.post('/login', validateRequest('login'), authController.login);

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', authController.refresh);

/**
 * Logout user
 * POST /api/v1/auth/logout
 * Note: Works even with invalid/expired access token
 */
router.post('/logout', authController.logout);

/**
 * Forgot password
 * POST /api/v1/auth/forgot-password
 */
router.post('/forgot-password', validateRequest('forgotPassword'), authController.forgotPassword);

/**
 * Reset password
 * POST /api/v1/auth/reset-password
 */
router.post('/reset-password', validateRequest('resetPassword'), authController.resetPassword);

module.exports = router;