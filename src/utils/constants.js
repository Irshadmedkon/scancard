/**
 * HTTP Status Codes
 */
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Error Codes
 */
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUBSCRIPTION_LIMIT_EXCEEDED: 'SUBSCRIPTION_LIMIT_EXCEEDED'
};

/**
 * Account Status
 */
const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

/**
 * Cache Keys
 */
const CACHE_KEYS = {
  USER_PROFILES: (userId) => `user:${userId}:profiles`,
  PROFILE: (profileId) => `profile:${profileId}`,
  PUBLIC_PROFILE: (username) => `profile:public:${username}`,
  USER_LEADS: (userId) => `user:${userId}:leads`,
  ANALYTICS: (profileId) => `analytics:${profileId}`
};

/**
 * Cache TTL (Time To Live) in seconds
 */
const CACHE_TTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600     // 1 hour
};

module.exports = {
  STATUS_CODES,
  ERROR_CODES,
  ACCOUNT_STATUS,
  CACHE_KEYS,
  CACHE_TTL
};