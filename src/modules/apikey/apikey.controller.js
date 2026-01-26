const { query, queryOne } = require('../../config/database');
const { formatResponse, generateRandomString } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');

class ApiKeyController {
  async getApiKeys(req, res) {
    const userId = req.user.user_id;
    const keys = await query(
      'SELECT key_id, key_name, api_key, is_active, last_used, expires_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(formatResponse(true, { api_keys: keys, count: keys.length }, 'API keys retrieved'));
  }

  async createApiKey(req, res) {
    const userId = req.user.user_id;
    const { key_name, expires_at } = req.body;
    const api_key = `tk_${generateRandomString(40)}`;

    const result = await query(
      'INSERT INTO api_keys (user_id, key_name, api_key, is_active, expires_at, created_at) VALUES (?, ?, ?, TRUE, ?, NOW())',
      [userId, key_name, api_key, expires_at || null]
    );

    const key = await queryOne('SELECT * FROM api_keys WHERE key_id = ?', [result.insertId]);
    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { api_key: key }, 'API key created'));
  }

  async getApiKey(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const key = await queryOne(
      'SELECT * FROM api_keys WHERE key_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!key) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'API key not found' }
      ));
    }

    res.json(formatResponse(true, { api_key: key }, 'API key retrieved'));
  }

  async updateApiKey(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;
    const { key_name, is_active } = req.body;

    const updates = [];
    const values = [];

    if (key_name) { updates.push('key_name = ?'); values.push(key_name); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

    if (updates.length > 0) {
      values.push(id, userId);
      await query(`UPDATE api_keys SET ${updates.join(', ')} WHERE key_id = ? AND user_id = ?`, values);
    }

    const key = await queryOne('SELECT * FROM api_keys WHERE key_id = ?', [id]);
    res.json(formatResponse(true, { api_key: key }, 'API key updated'));
  }

  async deleteApiKey(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    await query('DELETE FROM api_keys WHERE key_id = ? AND user_id = ?', [id, userId]);
    res.json(formatResponse(true, null, 'API key deleted'));
  }

  async regenerateApiKey(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const api_key = `tk_${generateRandomString(40)}`;

    await query(
      'UPDATE api_keys SET api_key = ? WHERE key_id = ? AND user_id = ?',
      [api_key, id, userId]
    );

    const key = await queryOne('SELECT * FROM api_keys WHERE key_id = ?', [id]);
    res.json(formatResponse(true, { api_key: key }, 'API key regenerated'));
  }
}

module.exports = new ApiKeyController();
