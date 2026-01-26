const { query, queryOne } = require('../../config/database');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');

class NotificationController {
  async getNotifications(req, res) {
    const userId = req.user.user_id;
    const { is_read, limit = 50 } = req.query;

    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (is_read !== undefined) {
      sql += ' AND is_read = ?';
      params.push(is_read === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const notifications = await query(sql, params);
    res.json(formatResponse(true, { notifications, count: notifications.length }, 'Notifications retrieved'));
  }

  async createNotification(req, res) {
    const userId = req.user.user_id;
    const { title, message, type, action_url } = req.body;

    const result = await query(
      'INSERT INTO notifications (user_id, title, message, type, action_url, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, title, message, type || 'info', action_url || null]
    );

    const notification = await queryOne('SELECT * FROM notifications WHERE notification_id = ?', [result.insertId]);
    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { notification }, 'Notification created'));
  }

  async getNotification(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const notification = await queryOne(
      'SELECT * FROM notifications WHERE notification_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!notification) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Notification not found' }
      ));
    }

    res.json(formatResponse(true, { notification }, 'Notification retrieved'));
  }

  async markAsRead(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    await query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [id, userId]
    );

    res.json(formatResponse(true, null, 'Notification marked as read'));
  }

  async deleteNotification(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    await query('DELETE FROM notifications WHERE notification_id = ? AND user_id = ?', [id, userId]);
    res.json(formatResponse(true, null, 'Notification deleted'));
  }
}

module.exports = new NotificationController();
