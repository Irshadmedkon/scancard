const { query, queryOne } = require('../../config/database');
const { formatResponse, generateRandomString } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');

class WebhookController {
  async getWebhooks(req, res) {
    const userId = req.user.user_id;
    const webhooks = await query(
      'SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(formatResponse(true, { webhooks, count: webhooks.length }, 'Webhooks retrieved'));
  }

  async createWebhook(req, res) {
    const userId = req.user.user_id;
    const { url, event_type } = req.body;
    const secret_key = generateRandomString(32);

    const result = await query(
      'INSERT INTO webhooks (user_id, url, event_type, secret_key, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())',
      [userId, url, event_type, secret_key]
    );

    const webhook = await queryOne('SELECT * FROM webhooks WHERE webhook_id = ?', [result.insertId]);
    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { webhook }, 'Webhook created'));
  }

  async getWebhook(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const webhook = await queryOne(
      'SELECT * FROM webhooks WHERE webhook_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!webhook) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Webhook not found' }
      ));
    }

    res.json(formatResponse(true, { webhook }, 'Webhook retrieved'));
  }

  async updateWebhook(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;
    const { url, event_type, is_active } = req.body;

    const updates = [];
    const values = [];

    if (url) { updates.push('url = ?'); values.push(url); }
    if (event_type) { updates.push('event_type = ?'); values.push(event_type); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(id, userId);
      await query(`UPDATE webhooks SET ${updates.join(', ')} WHERE webhook_id = ? AND user_id = ?`, values);
    }

    const webhook = await queryOne('SELECT * FROM webhooks WHERE webhook_id = ?', [id]);
    res.json(formatResponse(true, { webhook }, 'Webhook updated'));
  }

  async deleteWebhook(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    await query('DELETE FROM webhooks WHERE webhook_id = ? AND user_id = ?', [id, userId]);
    res.json(formatResponse(true, null, 'Webhook deleted'));
  }

  async testWebhook(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const webhook = await queryOne(
      'SELECT * FROM webhooks WHERE webhook_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!webhook) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Webhook not found' }
      ));
    }

    // TODO: Send test webhook request
    res.json(formatResponse(true, { test_sent: true }, 'Test webhook sent'));
  }
}

module.exports = new WebhookController();
