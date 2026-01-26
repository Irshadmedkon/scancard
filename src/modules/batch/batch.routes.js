const express = require('express');
const router = express.Router();
const batchController = require('./batch.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const Joi = require('joi');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');

/**
 * Batch Operations Routes
 */

// Validation schemas
const bulkCreateSchema = Joi.object({
  table: Joi.string().valid('leads', 'menu_items', 'product_catalog', 'bookings').required(),
  records: Joi.array().items(Joi.object()).min(1).max(100).required()
});

const bulkUpdateSchema = Joi.object({
  table: Joi.string().valid('leads', 'menu_items', 'product_catalog', 'bookings').required(),
  updates: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      data: Joi.object().required()
    })
  ).min(1).max(100).required()
});

const bulkDeleteSchema = Joi.object({
  table: Joi.string().valid('leads', 'menu_items', 'product_catalog', 'bookings').required(),
  ids: Joi.array().items(Joi.number()).min(1).max(100).required(),
  soft: Joi.boolean().default(true)
});

const bulkRestoreSchema = Joi.object({
  table: Joi.string().valid('leads', 'menu_items', 'product_catalog', 'bookings').required(),
  ids: Joi.array().items(Joi.number()).min(1).max(100).required()
});

// Validation middleware
function validate(schema) {
  return (req, res, next) => {
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

// Routes
router.post('/create', authMiddleware, validate(bulkCreateSchema), batchController.bulkCreate);
router.post('/update', authMiddleware, validate(bulkUpdateSchema), batchController.bulkUpdate);
router.post('/delete', authMiddleware, validate(bulkDeleteSchema), batchController.bulkDelete);
router.post('/restore', authMiddleware, validate(bulkRestoreSchema), batchController.bulkRestore);
router.get('/history', authMiddleware, batchController.getBatchHistory);
router.get('/trashed/:table', authMiddleware, batchController.getTrashed);

module.exports = router;
