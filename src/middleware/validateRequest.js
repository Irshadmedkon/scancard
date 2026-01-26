const Joi = require('joi');
const { formatResponse } = require('../utils/helpers');
const { STATUS_CODES } = require('../utils/constants');

// Validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().allow('', null).pattern(/^\+?[0-9]{10,15}$/).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    new_password: Joi.string().min(6).required()
  }),

  // Profile schemas
  profile: Joi.object({
    profile_name: Joi.string().min(2).max(100).required(),
    username: Joi.string().alphanum().min(3).max(50).optional(),
    bio: Joi.string().max(500).optional(),
    company: Joi.string().max(100).optional(),
    designation: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional(),
    is_public: Joi.boolean().optional()
  }),

  // Menu schemas
  menuCategory: Joi.object({
    category_name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    display_order: Joi.number().integer().min(0).optional()
  }),

  menuItem: Joi.object({
    category_id: Joi.number().integer().required(),
    item_name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    price: Joi.number().min(0).required(),
    discount_price: Joi.number().min(0).optional(),
    is_veg: Joi.boolean().optional(),
    is_available: Joi.boolean().optional(),
    preparation_time: Joi.number().integer().min(0).optional(),
    calories: Joi.number().integer().min(0).optional(),
    tags: Joi.string().max(200).optional()
  }),

  // Catalog schemas
  product: Joi.object({
    product_name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional(),
    sku: Joi.string().max(100).optional(),
    price: Joi.number().min(0).required(),
    discount_price: Joi.number().min(0).optional(),
    stock_quantity: Joi.number().integer().min(0).optional(),
    category: Joi.string().max(100).optional(),
    brand: Joi.string().max(100).optional(),
    tags: Joi.string().max(200).optional()
  }),

  // Booking schemas
  bookingService: Joi.object({
    service_name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    duration_minutes: Joi.number().integer().min(15).required(),
    price: Joi.number().min(0).required(),
    buffer_time: Joi.number().integer().min(0).optional()
  }),

  booking: Joi.object({
    service_id: Joi.number().integer().required(),
    booking_date: Joi.date().iso().required(),
    booking_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    customer_name: Joi.string().min(2).max(100).required(),
    customer_email: Joi.string().email().optional(),
    customer_phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
    notes: Joi.string().max(500).optional()
  }),

  availability: Joi.object({
    day_of_week: Joi.number().integer().min(0).max(6).required(),
    start_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    end_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    is_available: Joi.boolean().optional()
  }),

  // Lead schemas
  lead: Joi.object({
    profile_id: Joi.number().integer().required(),
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional(),
    company: Joi.string().max(100).optional(),
    message: Joi.string().max(1000).optional(),
    source: Joi.string().max(50).optional()
  })
};

/**
 * Validation middleware factory
 */
function validateRequest(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors
        }
      ));
    }

    req.body = value;
    next();
  };
}

module.exports = validateRequest;
