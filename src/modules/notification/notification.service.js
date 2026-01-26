const { query, queryOne } = require('../../config/database');
const logger = require('../../utils/logger');

class NotificationService {
  /**
   * Get all notifications for user
   */
  async getNotifications(userId, filters = {}) {
    const { is_read, limit = 50 } = filters;

    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (is_read !== undefined) {
      sql += ' AND is_read = ?';
      params.push(is_read === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const notifications = await query(sql, params);

    return notifications;
  }

  /**
   * Create notification
   */
  async createNotification(userId, notificationData) {
    const { title, message, type, action_url } = notificationData;

    const result = await query(
      'INSERT INTO notifications (user_id, title, message, type, action_url, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, title, message, type || 'info', action_url || null]
    );

    const notification = await queryOne('SELECT * FROM notifications WHERE notification_id = ?', [result.insertId]);

    logger.info('Notification created', { userId, notificationId: result.insertId });

    return notification;
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId, userId) {
    const notification = await queryOne(
      'SELECT * FROM notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await queryOne(
      'SELECT notification_id FROM notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    await query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ?',
      [notificationId]
    );

    logger.info('Notification marked as read', { userId, notificationId });
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId) {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    logger.info('All notifications marked as read', { userId });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    const notification = await queryOne(
      'SELECT notification_id FROM notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    await query('DELETE FROM notifications WHERE notification_id = ?', [notificationId]);

    logger.info('Notification deleted', { userId, notificationId });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    const result = await queryOne(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    return result.count;
  }

  /**
   * Send notification to user (helper method)
   */
  async sendToUser(userId, title, message, type = 'info', actionUrl = null) {
    return await this.createNotification(userId, {
      title,
      message,
      type,
      action_url: actionUrl
    });
  }
}

module.exports = new NotificationService();
