const db = require('../config/database');
const logger = require('./logger');

/**
 * Batch Operations Utility
 * Provides bulk create, update, and delete operations
 */

/**
 * Bulk insert records
 * @param {string} table - Table name
 * @param {Array} records - Array of records to insert
 * @param {Array} fields - Field names
 * @returns {Promise<Object>}
 */
async function bulkCreate(table, records, fields) {
  if (!records || records.length === 0) {
    return { success: true, inserted: 0 };
  }

  try {
    // Build placeholders
    const placeholders = records.map(() => 
      `(${fields.map(() => '?').join(', ')})`
    ).join(', ');

    // Flatten values
    const values = records.flatMap(record => 
      fields.map(field => record[field])
    );

    const query = `
      INSERT INTO ${table} (${fields.join(', ')})
      VALUES ${placeholders}
    `;

    const [result] = await db.execute(query, values);

    logger.info(`Bulk insert: ${result.affectedRows} records inserted into ${table}`);

    return {
      success: true,
      inserted: result.affectedRows,
      firstId: result.insertId
    };
  } catch (error) {
    logger.error(`Bulk create failed for ${table}:`, error);
    throw error;
  }
}

/**
 * Bulk update records
 * @param {string} table - Table name
 * @param {Array} updates - Array of {id, data} objects
 * @returns {Promise<Object>}
 */
async function bulkUpdate(table, updates) {
  if (!updates || updates.length === 0) {
    return { success: true, updated: 0 };
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    let updatedCount = 0;

    for (const update of updates) {
      const { id, data } = update;
      const fields = Object.keys(data);
      const values = Object.values(data);

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;

      const [result] = await connection.execute(query, [...values, id]);
      updatedCount += result.affectedRows;
    }

    await connection.commit();

    logger.info(`Bulk update: ${updatedCount} records updated in ${table}`);

    return {
      success: true,
      updated: updatedCount
    };
  } catch (error) {
    await connection.rollback();
    logger.error(`Bulk update failed for ${table}:`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Bulk delete records
 * @param {string} table - Table name
 * @param {Array} ids - Array of IDs to delete
 * @param {boolean} soft - Use soft delete
 * @param {number} userId - User performing delete (for soft delete)
 * @returns {Promise<Object>}
 */
async function bulkDelete(table, ids, soft = false, userId = null) {
  if (!ids || ids.length === 0) {
    return { success: true, deleted: 0 };
  }

  try {
    let query;
    let values;

    if (soft) {
      query = `
        UPDATE ${table} 
        SET is_deleted = 1, deleted_at = NOW(), deleted_by = ?
        WHERE id IN (${ids.map(() => '?').join(', ')})
      `;
      values = [userId, ...ids];
    } else {
      query = `DELETE FROM ${table} WHERE id IN (${ids.map(() => '?').join(', ')})`;
      values = ids;
    }

    const [result] = await db.execute(query, values);

    logger.info(`Bulk delete: ${result.affectedRows} records deleted from ${table}`);

    return {
      success: true,
      deleted: result.affectedRows
    };
  } catch (error) {
    logger.error(`Bulk delete failed for ${table}:`, error);
    throw error;
  }
}

/**
 * Bulk upsert (insert or update)
 * @param {string} table - Table name
 * @param {Array} records - Array of records
 * @param {Array} fields - Field names
 * @param {Array} updateFields - Fields to update on duplicate
 * @returns {Promise<Object>}
 */
async function bulkUpsert(table, records, fields, updateFields) {
  if (!records || records.length === 0) {
    return { success: true, affected: 0 };
  }

  try {
    // Build placeholders
    const placeholders = records.map(() => 
      `(${fields.map(() => '?').join(', ')})`
    ).join(', ');

    // Flatten values
    const values = records.flatMap(record => 
      fields.map(field => record[field])
    );

    // Build ON DUPLICATE KEY UPDATE clause
    const updateClause = updateFields.map(field => 
      `${field} = VALUES(${field})`
    ).join(', ');

    const query = `
      INSERT INTO ${table} (${fields.join(', ')})
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE ${updateClause}
    `;

    const [result] = await db.execute(query, values);

    logger.info(`Bulk upsert: ${result.affectedRows} records affected in ${table}`);

    return {
      success: true,
      affected: result.affectedRows
    };
  } catch (error) {
    logger.error(`Bulk upsert failed for ${table}:`, error);
    throw error;
  }
}

/**
 * Batch process with chunks
 * @param {Array} items - Items to process
 * @param {Function} processor - Processing function
 * @param {number} chunkSize - Chunk size
 * @returns {Promise<Array>}
 */
async function batchProcess(items, processor, chunkSize = 100) {
  const results = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(item => processor(item))
    );
    results.push(...chunkResults);
  }

  return results;
}

module.exports = {
  bulkCreate,
  bulkUpdate,
  bulkDelete,
  bulkUpsert,
  batchProcess
};
