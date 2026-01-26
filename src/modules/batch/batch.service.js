const db = require('../../config/database');
const logger = require('../../utils/logger');
const { bulkCreate: bulkCreateUtil, bulkUpdate: bulkUpdateUtil, bulkDelete: bulkDeleteUtil } = require('../../utils/batchOperations');
const { restore, getTrashed: getTrashedUtil } = require('../../utils/softDelete');

/**
 * Batch Operations Service
 */

/**
 * Bulk create records
 */
async function bulkCreate(table, records, userId) {
  try {
    // Validate table name (security)
    const allowedTables = ['leads', 'menu_items', 'product_catalog', 'bookings'];
    if (!allowedTables.includes(table)) {
      throw new Error('Invalid table name');
    }

    // Add audit fields
    const enrichedRecords = records.map(record => ({
      ...record,
      created_by: userId,
      updated_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    }));

    const fields = Object.keys(enrichedRecords[0]);
    const result = await bulkCreateUtil(table, enrichedRecords, fields);

    // Log batch operation
    await logBatchOperation(userId, 'bulk_create', table, result.inserted);

    return result;
  } catch (error) {
    logger.error('Bulk create failed:', error);
    throw error;
  }
}

/**
 * Bulk update records
 */
async function bulkUpdate(table, updates, userId) {
  try {
    // Validate table name
    const allowedTables = ['leads', 'menu_items', 'product_catalog', 'bookings'];
    if (!allowedTables.includes(table)) {
      throw new Error('Invalid table name');
    }

    // Add audit fields
    const enrichedUpdates = updates.map(update => ({
      id: update.id,
      data: {
        ...update.data,
        updated_by: userId,
        updated_at: new Date()
      }
    }));

    const result = await bulkUpdateUtil(table, enrichedUpdates);

    // Log batch operation
    await logBatchOperation(userId, 'bulk_update', table, result.updated);

    return result;
  } catch (error) {
    logger.error('Bulk update failed:', error);
    throw error;
  }
}

/**
 * Bulk delete records
 */
async function bulkDelete(table, ids, soft = true, userId) {
  try {
    // Validate table name
    const allowedTables = ['leads', 'menu_items', 'product_catalog', 'bookings'];
    if (!allowedTables.includes(table)) {
      throw new Error('Invalid table name');
    }

    const result = await bulkDeleteUtil(table, ids, soft, userId);

    // Log batch operation
    await logBatchOperation(userId, soft ? 'bulk_soft_delete' : 'bulk_delete', table, result.deleted);

    return result;
  } catch (error) {
    logger.error('Bulk delete failed:', error);
    throw error;
  }
}

/**
 * Bulk restore records
 */
async function bulkRestore(table, ids) {
  try {
    // Validate table name
    const allowedTables = ['leads', 'menu_items', 'product_catalog', 'bookings'];
    if (!allowedTables.includes(table)) {
      throw new Error('Invalid table name');
    }

    let restoredCount = 0;
    for (const id of ids) {
      const restored = await restore(table, id);
      if (restored) restoredCount++;
    }

    return {
      success: true,
      restored: restoredCount
    };
  } catch (error) {
    logger.error('Bulk restore failed:', error);
    throw error;
  }
}

/**
 * Get batch operation history
 */
async function getBatchHistory(userId, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM batch_operations
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [operations] = await db.execute(query, [userId, parseInt(limit), offset]);

    const countQuery = `SELECT COUNT(*) as total FROM batch_operations WHERE user_id = ?`;
    const [[{ total }]] = await db.execute(countQuery, [userId]);

    return {
      operations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get batch history failed:', error);
    throw error;
  }
}

/**
 * Get trashed records
 */
async function getTrashed(table, userId) {
  try {
    // Validate table name
    const allowedTables = ['leads', 'menu_items', 'product_catalog', 'bookings'];
    if (!allowedTables.includes(table)) {
      throw new Error('Invalid table name');
    }

    const records = await getTrashedUtil(table);

    // Filter by user ownership if applicable
    const userRecords = records.filter(record => 
      record.user_id === userId || record.created_by === userId
    );

    return userRecords;
  } catch (error) {
    logger.error('Get trashed failed:', error);
    throw error;
  }
}

/**
 * Log batch operation
 */
async function logBatchOperation(userId, operationType, tableName, recordsAffected) {
  try {
    const query = `
      INSERT INTO batch_operations 
      (user_id, operation_type, table_name, records_affected, status, completed_at)
      VALUES (?, ?, ?, ?, 'completed', NOW())
    `;

    await db.execute(query, [userId, operationType, tableName, recordsAffected]);
  } catch (error) {
    logger.error('Log batch operation failed:', error);
    // Don't throw, just log
  }
}

module.exports = {
  bulkCreate,
  bulkUpdate,
  bulkDelete,
  bulkRestore,
  getBatchHistory,
  getTrashed
};
