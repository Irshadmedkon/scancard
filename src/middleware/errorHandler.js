const logger = require('../utils/logger');
const { formatResponse } = require('../utils/helpers');
const { STATUS_CODES, ERROR_CODES } = require('../utils/constants');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.user_id
  });

  // Default error response
  let statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
  let errorCode = err.code || ERROR_CODES.INTERNAL_ERROR;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Handle specific error types
  if (err.name === 'ValidationError' || err.code === 'VALIDATION_ERROR') {
    statusCode = STATUS_CODES.UNPROCESSABLE_ENTITY;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = STATUS_CODES.CONFLICT;
    errorCode = ERROR_CODES.DUPLICATE_ENTRY;
    message = 'Duplicate entry. Record already exists.';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = STATUS_CODES.BAD_REQUEST;
    message = 'Referenced record does not exist.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = STATUS_CODES.UNAUTHORIZED;
    errorCode = ERROR_CODES.INVALID_TOKEN;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = STATUS_CODES.UNAUTHORIZED;
    errorCode = ERROR_CODES.TOKEN_EXPIRED;
    message = 'Authentication token has expired.';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === STATUS_CODES.INTERNAL_SERVER_ERROR) {
    message = 'An unexpected error occurred. Please try again later.';
    details = null;
  }

  // Send error response
  res.status(statusCode).json(formatResponse(
    false,
    null,
    '',
    {
      code: errorCode,
      message,
      ...(details && { details })
    }
  ));
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
    false,
    null,
    '',
    {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route ${req.method} ${req.url} not found`
    }
  ));
}

module.exports = {
  errorHandler,
  notFoundHandler
};