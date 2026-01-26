const { query, queryOne } = require('../../config/database');
const { generateRandomString } = require('../../utils/helpers');
const logger = require('../../utils/logger');
const axios = require('axios');

class WebhookService {
  /**
   * Get all webhooks for user
   */
  async getWebhooks(userId) {
    const webhooks = await query(
      'SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return webhooks;
  }

  /**
   * Create webhook
   */
  async createWebhook(userId, webhookData) {
    const { url, event_type } = webhookData;
    const secret_key = generateRandomString(32);

    const result = await query(
      'INSERT INTO webhooks (user_id, url, event_type, secret_key, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())',
      [userId, url, event_type, secret_key]
    );

    const webhook = await queryOne('SELECT * FROM webhooks WHERE webhook_id = ?', [result.insertId]);

    logger.info('Webhook created', { userId, webhookId: result.insertId });

    return webhook;
  }

  /**
   * Get webhook by ID
   */
  async getWebhookById(webhookId, userId) {
    const webhook = await queryOne(
      'SELECT * FROM webhooks WHERE webhook_id = ? AND user_id = ?',
      [webhookId, userId]
    );

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return webhook;
  }

  /**
   * Update webhook
   */
  async updateWebhook(webhookId, userId, updates) {
    const webhook = await queryOne(
      'SELECT webhook_id FROM webhooks WHERE webhook_id = ? AND user_id = ?',
      [webhookId, userId]
    );

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const { url, event_type, is_active } = updates;

    const updateFields = [];
    const updateValues = [];

    if (url) {
      updateFields.push('url = ?');
      updateValues.push(url);
    }
    if (event_type) {
      updateFields.push('event_type = ?');
      updateValues.push(event_type);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateValues.push(webhookId);
      await query(`UPDATE webhooks SET ${updateFields.join(', ')} WHERE webhook_id = ?`, updateValues);
    }

    const updatedWebhook = await queryOne('SELECT * FROM webhooks WHERE webhook_id = ?', [webhookId]);

    logger.info('Webhook updated', { userId, webhookId });

    return updatedWebhook;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId, userId) {
    const webhook = await queryOne(
      'SELECT webhook_id FROM webhooks WHERE webhook_id = ? AND user_id = ?',
      [webhookId, userId]
    );

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    await query('DELETE FROM webhooks WHERE webhook_id = ?', [webhookId]);

    logger.info('Webhook deleted', { userId, webhookId });
  }

  /**
   * Test webhook
   */
  async testWebhook(webhookId, userId) {
    const webhook = await queryOne(
      'SELECT * FROM webhooks WHERE webhook_id = ? AND user_id = ?',
      [webhookId, userId]
    );

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook'
      }
    };

    try {
      await this.triggerWebhook(webhook, testPayload);
      return { success: true, message: 'Test webhook sent successfully' };
    } catch (error) {
      logger.error('Webhook test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger webhook (internal method)
   */
  async triggerWebhook(webhook, payload) {
    if (!webhook.is_active) {
      return;
    }

    try {
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret_key,
          'X-Webhook-Event': webhook.event_type
        },
        timeout: 5000
      });

      logger.info('Webhook triggered successfully', {
        webhookId: webhook.webhook_id,
        status: response.status
      });

      return { success: true, status: response.status };
    } catch (error) {
      logger.error('Webhook trigger failed:', {
        webhookId: webhook.webhook_id,
        error: error.message
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger webhooks for event
   */
  async triggerWebhooksForEvent(userId, eventType, eventData) {
    const webhooks = await query(
      'SELECT * FROM webhooks WHERE user_id = ? AND event_type = ? AND is_active = TRUE',
      [userId, eventType]
    );

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: eventData
    };

    const results = [];

    for (const webhook of webhooks) {
      const result = await this.triggerWebhook(webhook, payload);
      results.push({
        webhook_id: webhook.webhook_id,
        ...result
      });
    }

    return results;
  }
}

module.exports = new WebhookService();
