const { query, queryOne } = require('../../config/database');
const { generateRandomString } = require('../../utils/helpers');
const logger = require('../../utils/logger');

class ApiKeyService {
  /**
   * Get all API keys for user
   */
  async getApiKeys(userId) {
    const keys = await query(
      'SELECT key_id, key_name, api_key, is_active, last_used, expires_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return keys;
  }

  /**
   * Create new API key
   */
  async createApiKey(userId, keyData) {
    const { key_name, expires_at } = keyData;
    const api_key = `tk_${generateRandomString(40)}`;

    const result = await query(
      'INSERT INTO api_keys (user_id, key_name, api_key, is_active, expires_at, created_at) VALUES (?, ?, ?, TRUE, ?, NOW())',
      [userId, key_name, api_key, expires_at || null]
    );

    const key = await queryOne('SELECT * FROM api_keys WHERE key_id = ?', [result.insertId]);

    logger.info('API key created', { userId, keyId: result.insertId });

    return key;
  }

  /**
   * Get API key by ID
   */
  async getApiKeyById(keyId, userId) {
    const key = await queryOne(
      'SELECT * FROM api_keys WHERE key_id = ? AND user_id = ?',
      [keyId, userId]
    );

    if (!key) {
      throw new Error('API key not found');
    }

    return key;
  }

  /**
   * Update API key
   */
  async updateApiKey(keyId, userId, updates) {
    const key = await queryOne(
      'SELECT key_id FROM api_keys WHERE key_id = ? AND user_id = ?',
      [keyId, userId]
    );

    if (!key) {
      throw new Error('API key not found');
    }

    const { key_name, is_active } = updates;

    const updateFields = [];
    const updateValues = [];

    if (key_name) {
      updateFields.push('key_name = ?');
      updateValues.push(key_name);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length > 0) {
      updateValues.push(keyId);
      await query(`UPDATE api_keys SET ${updateFields.join(', ')} WHERE key_id = ?`, updateValues);
    }

    const updatedKey = await queryOne('SELECT * FROM api_keys WHERE key_id = ?', [keyId]);

    logger.info('API key updated', { userId, keyId });

    return updatedKey;
  }

  /**
   * Delete API key
   */
  async deleteApiKey(keyId, userId) {
    const key = await queryOne(
      'SELECT key_id FROM api_keys WHERE key_id = ? AND user_id = ?',
      [keyId, userId]
    );

    if (!key) {
      throw new Error('API key not found');
    }

    await query('DELETE FROM api_keys WHERE key_id = ?', [keyId]);

    logger.info('API key deleted', { userId, keyId });
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(keyId, userId) {
    const key = await queryOne(
      'SELECT key_id FROM api_keys WHERE key_id = ? AND user_id = ?',
      [keyId, userId]
    );

    if (!key) {
      throw new Error('API key not found');
    }

    const new_api_key = `tk_${generateRandomString(40)}`;

    await query(
      'UPDATE api_keys SET api_key = ? WHERE key_id = ?',
      [new_api_key, keyId]
    );

    const updatedKey = await queryOne('SELECT * FROM api_keys WHERE key_id = ?', [keyId]);

    logger.info('API key regenerated', { userId, keyId });

    return updatedKey;
  }

  /**
   * Verify API key
   */
  async verifyApiKey(apiKey) {
    const key = await queryOne(
      `SELECT k.*, u.user_id, u.email, u.is_active as user_active
       FROM api_keys k
       JOIN users u ON k.user_id = u.user_id
       WHERE k.api_key = ? AND k.is_active = TRUE`,
      [apiKey]
    );

    if (!key) {
      throw new Error('Invalid API key');
    }

    if (!key.user_active) {
      throw new Error('User account is inactive');
    }

    // Check expiry
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      throw new Error('API key has expired');
    }

    // Update last used
    await query('UPDATE api_keys SET last_used = NOW() WHERE key_id = ?', [key.key_id]);

    return {
      user_id: key.user_id,
      email: key.email,
      key_name: key.key_name
    };
  }
}

module.exports = new ApiKeyService();
