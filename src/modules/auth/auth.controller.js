const authService = require('./auth.service');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');
const logger = require('../../utils/logger');

class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      
      res.status(STATUS_CODES.CREATED).json(formatResponse(
        true,
        result,
        'Registration successful'
      ));
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        { code: 'REGISTRATION_ERROR', message: error.message }
      ));
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      res.json(formatResponse(true, result, 'Login successful'));
    } catch (error) {
      logger.error('Login error:', error);
      res.status(STATUS_CODES.UNAUTHORIZED).json(formatResponse(
        false,
        null,
        '',
        { code: 'LOGIN_ERROR', message: error.message }
      ));
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
          false,
          null,
          '',
          { code: 'MISSING_TOKEN', message: 'Refresh token is required' }
        ));
      }

      const result = await authService.refreshToken(refresh_token);
      
      res.json(formatResponse(true, result, 'Token refreshed successfully'));
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(STATUS_CODES.UNAUTHORIZED).json(formatResponse(
        false,
        null,
        '',
        { code: 'INVALID_TOKEN', message: error.message }
      ));
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    try {
      const { refresh_token } = req.body;
      await authService.logout(refresh_token);
      
      logger.info('User logged out', { userId: req.user?.user_id });
      
      res.json(formatResponse(true, null, 'Logout successful'));
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(
        false,
        null,
        '',
        { code: 'LOGOUT_ERROR', message: error.message }
      ));
    }
  }

  /**
   * Forgot password
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      
      res.json(formatResponse(
        true,
        result,
        'If email exists, password reset link has been sent'
      ));
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(
        false,
        null,
        '',
        { code: 'FORGOT_PASSWORD_ERROR', message: error.message }
      ));
    }
  }

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;
      await authService.resetPassword(token, new_password);
      
      res.json(formatResponse(true, null, 'Password reset successful'));
    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        { code: 'RESET_PASSWORD_ERROR', message: error.message }
      ));
    }
  }
}

module.exports = new AuthController();
