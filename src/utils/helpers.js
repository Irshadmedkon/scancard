/**
 * Format API response
 */
function formatResponse(success, data = null, message = '', error = null) {
  const response = {
    success,
    timestamp: new Date().toISOString()
  };

  if (message) response.message = message;
  if (data !== null) response.data = data;
  if (error) response.error = error;

  return response;
}

/**
 * Generate username from name
 */
function generateUsername(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const random = Math.floor(Math.random() * 10000);
  return `${base}${random}`;
}

/**
 * Paginate results
 */
function paginate(page = 1, limit = 20) {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  return {
    limit: parseInt(limit),
    offset,
    page: parseInt(page)
  };
}

/**
 * Generate random string
 */
function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
}

/**
 * Calculate pagination metadata
 */
function getPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1
  };
}

module.exports = {
  formatResponse,
  generateUsername,
  paginate,
  generateRandomString,
  sanitizeFilename,
  getPaginationMeta
};
