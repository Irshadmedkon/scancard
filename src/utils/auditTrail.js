const db = require('../config/database');
const logger = require('./logger');

/**
 * Audit Trail Utility
 * Tracks who created/updated records and when
 */

/**
 * Add audit fields to INSERT query
 * @param {number} userId - User performing the action
 * @returns {Object} - Audit fields
 */
function getCreateAudit(userId) {
  return {
    created_by: userId,
    created_at: new Date(),
    updated_by: userId,
    updated_at: new Date()
  };
}

/**
 * Add audit fields to UPDATE query
 * @param {number} userId - User performing the action
 * @returns {Object} - Audit fields
 */
function getUpdateAudit(userId) {
  return {
    updated_by: userId,
    updated_at: new Date()
  };
}

/**
 * Log audit trail to database
 * @param {Object} auditData - Audit data
 */
async function logAudit(auditData) {
  try {
    const {
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      ip_address,
      user_agent
    } = auditData;

    const query = `
      INSERT INTO audit_logs 
      (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await db.execute(query, [
      user_id,
      action,
      table_name,
      record_id,
      JSON.stringify(old_values),
      JSON.stringify(new_values),
      ip_address,
      user_agent
    ]);
  } catch (error) {
    // Don't throw error, just log it
    logger.error('Audit log failed:', error);
  }
}

/**
 * Get audit history for a record
 * @param {string} tableName - Table name
 * @param {number} recordId - Record ID
 * @returns {Promise<Array>}
 */
async function getAuditHistory(tableName, recordId) {
  try {
    const query = `
      SELECT 
        al.*,
        u.full_name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE al.table_name = ? AND al.record_id = ?
      ORDER BY al.created_at DESC
    `;

    const [rows] = await db.execute(query, [tableName, recordId]);
    return rows;
  } catch (error) {
    logger.error('Get audit history failed:', error);
    return [];
  }
}

/**
 * Middleware to track changes
 */
function auditMiddleware(tableName) {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function
    res.send = function (data) {
      // Log audit trail for successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const action = req.method;
        const recordId = req.params.id || req.body?.id;

        if (recordId && req.user) {
          logAudit({
            user_id: req.user.user_id,
            action,
            table_name: tableName,
            record_id: recordId,
            old_values: req.oldValues || null,
            new_values: req.body || null,
            ip_address: req.ip,
            user_agent: req.get('user-agent')
          });
        }
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
}

module.exports = {
  getCreateAudit,
  getUpdateAudit,
  logAudit,
  getAuditHistory,
  auditMiddleware
};
