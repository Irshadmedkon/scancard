const logger = require('../utils/logger');

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Log request
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.user_id
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    if (res.statusCode >= 400) {
      logger.error('Request failed', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.user_id
      });
    } else {
      logger.info('Request completed', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user?.user_id
      });
    }

    originalEnd.apply(this, args);
  };

  next();
}

/**
 * Request timer middleware
 */
function requestTimer(req, res, next) {
  req.startTime = Date.now();
  next();
}

module.exports = {
  requestLogger,
  requestTimer
};