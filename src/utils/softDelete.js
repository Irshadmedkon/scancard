const db = require('../config/database');
const logger = require('./logger');

/**
 * Soft Delete Utility
 * Provides soft delete functionality for database records
 */

/**
 * Soft delete a record
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @param {number} userId - User performing the delete
 * @returns {Promise<boolean>}
 */
async function softDelete(table, id, userId) {
  try {
    const query = `
      UPDATE ${table} 
      SET is_deleted = 1, 
          deleted_at = NOW(), 
          deleted_by = ?
      WHERE id = ? AND is_deleted = 0
    `;
    
    const [result] = await db.execute(query, [userId, id]);
    return result.affectedRows > 0;
  } catch (error) {
    logger.error(`Soft delete failed for ${table}:`, error);
    throw error;
  }
}

/**
 * Restore a soft-deleted record
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @returns {Promise<boolean>}
 */
async function restore(table, id) {
  try {
    const query = `
      UPDATE ${table} 
      SET is_deleted = 0, 
          deleted_at = NULL, 
          deleted_by = NULL
      WHERE id = ? AND is_deleted = 1
    `;
    
    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    logger.error(`Restore failed for ${table}:`, error);
    throw error;
  }
}

/**
 * Permanently delete a record
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @returns {Promise<boolean>}
 */
async function forceDelete(table, id) {
  try {
    const query = `DELETE FROM ${table} WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    logger.error(`Force delete failed for ${table}:`, error);
    throw error;
  }
}

/**
 * Get all soft-deleted records
 * @param {string} table - Table name
 * @returns {Promise<Array>}
 */
async function getTrashed(table) {
  try {
    const query = `SELECT * FROM ${table} WHERE is_deleted = 1`;
    const [rows] = await db.execute(query);
    return rows;
  } catch (error) {
    logger.error(`Get trashed failed for ${table}:`, error);
    throw error;
  }
}

/**
 * Add soft delete WHERE clause
 * @param {boolean} includeTrashed - Include deleted records
 * @returns {string}
 */
function softDeleteClause(includeTrashed = false) {
  return includeTrashed ? '' : 'AND is_deleted = 0';
}

module.exports = {
  softDelete,
  restore,
  forceDelete,
  getTrashed,
  softDeleteClause
};
