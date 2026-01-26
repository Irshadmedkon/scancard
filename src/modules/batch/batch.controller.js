const batchService = require('./batch.service');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');
const logger = require('../../utils/logger');
const asyncHandler = require('express-async-errors');

/**
 * Batch Operations Controller
 * Handles bulk create, update, delete operations
 */

/**
 * Bulk create records
 */
const bulkCreate = async (req, res) => {
  const { table, records } = req.body;
  const userId = req.user.user_id;

  const result = await batchService.bulkCreate(table, records, userId);

  res.status(STATUS_CODES.CREATED).json(
    formatResponse(true, result, 'Records created successfully')
  );
};

/**
 * Bulk update records
 */
const bulkUpdate = async (req, res) => {
  const { table, updates } = req.body;
  const userId = req.user.user_id;

  const result = await batchService.bulkUpdate(table, updates, userId);

  res.status(STATUS_CODES.OK).json(
    formatResponse(true, result, 'Records updated successfully')
  );
};

/**
 * Bulk delete records
 */
const bulkDelete = async (req, res) => {
  const { table, ids, soft = true } = req.body;
  const userId = req.user.user_id;

  const result = await batchService.bulkDelete(table, ids, soft, userId);

  res.status(STATUS_CODES.OK).json(
    formatResponse(true, result, 'Records deleted successfully')
  );
};

/**
 * Restore soft-deleted records
 */
const bulkRestore = async (req, res) => {
  const { table, ids } = req.body;

  const result = await batchService.bulkRestore(table, ids);

  res.status(STATUS_CODES.OK).json(
    formatResponse(true, result, 'Records restored successfully')
  );
};

/**
 * Get batch operation history
 */
const getBatchHistory = async (req, res) => {
  const userId = req.user.user_id;
  const { page = 1, limit = 20 } = req.query;

  const result = await batchService.getBatchHistory(userId, page, limit);

  res.status(STATUS_CODES.OK).json(
    formatResponse(true, result, 'Batch history retrieved successfully')
  );
};

/**
 * Get trashed records
 */
const getTrashed = async (req, res) => {
  const { table } = req.params;
  const userId = req.user.user_id;

  const result = await batchService.getTrashed(table, userId);

  res.status(STATUS_CODES.OK).json(
    formatResponse(true, result, 'Trashed records retrieved successfully')
  );
};

module.exports = {
  bulkCreate,
  bulkUpdate,
  bulkDelete,
  bulkRestore,
  getBatchHistory,
  getTrashed
};
