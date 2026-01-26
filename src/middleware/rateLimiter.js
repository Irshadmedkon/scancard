const rateLimit = require('express-rate-limit');
const { STATUS_CODES, ERROR_CODES } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: formatResponse(
    false,
    null,
    '',
    {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests from this IP, please try again later.'
    }
  ),
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for sensitive operations
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per minute
  message: formatResponse(
    false,
    null,
    '',
    {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many attempts, please try again later.'
    }
  ),
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Moderate rate limiter for regular operations
 */
const moderateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per minute
  message: formatResponse(
    false,
    null,
    '',
    {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests, please slow down.'
    }
  ),
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  strictLimiter,
  moderateLimiter
};