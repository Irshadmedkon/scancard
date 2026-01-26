const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/database');
const { formatResponse } = require('../utils/helpers');
const { STATUS_CODES, ERROR_CODES } = require('../utils/constants');

/**
 * Authentication middleware
 */
async function authMiddleware(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'No token provided'
        }
      ));
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await queryOne(
      'SELECT user_id, email, full_name, is_active FROM users WHERE user_id = ?',
      [decoded.user_id]
    );

    if (!user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'User not found'
        }
      ));
    }

    if (!user.is_active) {
      return res.status(STATUS_CODES.FORBIDDEN).json(formatResponse(
        false,
        null,
        '',
        {
          code: 'ACCOUNT_DISABLED',
          message: 'Account is disabled'
        }
      ));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(STATUS_CODES.UNAUTHORIZED).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'Invalid token'
        }
      ));
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(STATUS_CODES.UNAUTHORIZED).json(formatResponse(
        false,
        null,
        '',
        {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        }
      ));
    }

    return res.status(STATUS_CODES.UNAUTHORIZED).json(formatResponse(
      false,
      null,
      '',
      {
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Authentication failed'
      }
    ));
  }
}

/**
 * Optional authentication middleware
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await queryOne(
      'SELECT user_id, email, full_name FROM users WHERE user_id = ? AND is_active = 1',
      [decoded.user_id]
    );

    req.user = user || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};