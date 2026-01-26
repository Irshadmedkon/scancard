const cron = require('node-cron');
const logger = require('../utils/logger');
const db = require('../config/database');
const jobQueue = require('./jobQueue');

/**
 * Scheduled Tasks Service
 * Handles cron jobs and scheduled tasks
 */

class Scheduler {
  constructor() {
    this.tasks = new Map();
  }

  /**
   * Initialize all scheduled tasks
   */
  init() {
    logger.info('Initializing scheduled tasks');

    // Daily analytics aggregation at 1 AM
    this.schedule('daily-analytics', '0 1 * * *', async () => {
      await this.aggregateDailyAnalytics();
    });

    // Cleanup old logs every day at 2 AM
    this.schedule('cleanup-logs', '0 2 * * *', async () => {
      await this.cleanupOldLogs();
    });

    // Check subscription renewals every hour
    this.schedule('subscription-renewals', '0 * * * *', async () => {
      await this.checkSubscriptionRenewals();
    });

    // Send daily reports at 9 AM
    this.schedule('daily-reports', '0 9 * * *', async () => {
      await this.sendDailyReports();
    });

    // Cleanup expired tokens every 6 hours
    this.schedule('cleanup-tokens', '0 */6 * * *', async () => {
      await this.cleanupExpiredTokens();
    });

    // Archive old data monthly (1st day at 3 AM)
    this.schedule('archive-data', '0 3 1 * *', async () => {
      await this.archiveOldData();
    });

    logger.info(`${this.tasks.size} scheduled tasks initialized`);
  }

  /**
   * Schedule a task
   * @param {string} name - Task name
   * @param {string} cronExpression - Cron expression
   * @param {Function} handler - Task handler
   */
  schedule(name, cronExpression, handler) {
    try {
      const task = cron.schedule(cronExpression, async () => {
        logger.info(`Running scheduled task: ${name}`);
        try {
          await handler();
          logger.info(`Scheduled task completed: ${name}`);
        } catch (error) {
          logger.error(`Scheduled task failed: ${name}`, error);
        }
      });

      this.tasks.set(name, task);
      logger.info(`Scheduled task registered: ${name} (${cronExpression})`);
    } catch (error) {
      logger.error(`Failed to schedule task: ${name}`, error);
    }
  }

  /**
   * Aggregate daily analytics
   */
  async aggregateDailyAnalytics() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const query = `
        INSERT INTO analytics_daily 
        (date, total_views, total_leads, total_users, created_at)
        SELECT 
          DATE(created_at) as date,
          COUNT(DISTINCT CASE WHEN event_type = 'profile_view' THEN event_id END) as total_views,
          COUNT(DISTINCT CASE WHEN event_type = 'lead_created' THEN event_id END) as total_leads,
          COUNT(DISTINCT user_id) as total_users,
          NOW()
        FROM analytics_events
        WHERE DATE(created_at) = DATE(?)
        GROUP BY DATE(created_at)
        ON DUPLICATE KEY UPDATE
          total_views = VALUES(total_views),
          total_leads = VALUES(total_leads),
          total_users = VALUES(total_users)
      `;

      await db.execute(query, [yesterday]);
      logger.info('Daily analytics aggregated successfully');
    } catch (error) {
      logger.error('Failed to aggregate daily analytics:', error);
    }
  }

  /**
   * Cleanup old logs
   */
  async cleanupOldLogs() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Delete old audit logs
      const auditQuery = `DELETE FROM audit_logs WHERE created_at < ?`;
      const [auditResult] = await db.execute(auditQuery, [thirtyDaysAgo]);

      // Delete old analytics events
      const analyticsQuery = `DELETE FROM analytics_events WHERE created_at < ?`;
      const [analyticsResult] = await db.execute(analyticsQuery, [thirtyDaysAgo]);

      logger.info('Old logs cleaned up', {
        auditLogs: auditResult.affectedRows,
        analyticsEvents: analyticsResult.affectedRows
      });
    } catch (error) {
      logger.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Check subscription renewals
   */
  async checkSubscriptionRenewals() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const query = `
        SELECT s.*, u.email, u.full_name
        FROM subscriptions s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.end_date <= ? 
        AND s.status = 'active'
        AND s.auto_renew = 1
      `;

      const [subscriptions] = await db.execute(query, [tomorrow]);

      for (const subscription of subscriptions) {
        // Queue renewal notification email
        await jobQueue.add('send_email', {
          to: subscription.email,
          subject: 'Subscription Renewal Reminder',
          html: `<p>Hi ${subscription.full_name},</p>
                 <p>Your subscription will renew tomorrow.</p>`
        });
      }

      logger.info(`Checked ${subscriptions.length} subscriptions for renewal`);
    } catch (error) {
      logger.error('Failed to check subscription renewals:', error);
    }
  }

  /**
   * Send daily reports
   */
  async sendDailyReports() {
    try {
      // Get users who want daily reports
      const query = `
        SELECT u.user_id, u.email, u.full_name
        FROM users u
        WHERE u.email_preferences LIKE '%daily_report%'
      `;

      const [users] = await db.execute(query);

      for (const user of users) {
        // Queue report generation and email
        await jobQueue.add('generate_report', {
          userId: user.user_id,
          reportType: 'daily',
          email: user.email
        });
      }

      logger.info(`Queued daily reports for ${users.length} users`);
    } catch (error) {
      logger.error('Failed to send daily reports:', error);
    }
  }

  /**
   * Cleanup expired tokens
   */
  async cleanupExpiredTokens() {
    try {
      const query = `DELETE FROM refresh_tokens WHERE expires_at < NOW()`;
      const [result] = await db.execute(query);

      logger.info(`Cleaned up ${result.affectedRows} expired tokens`);
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error);
    }
  }

  /**
   * Archive old data
   */
  async archiveOldData() {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Archive old leads
      const leadsQuery = `
        UPDATE leads 
        SET is_archived = 1 
        WHERE created_at < ? AND is_archived = 0
      `;
      const [leadsResult] = await db.execute(leadsQuery, [oneYearAgo]);

      // Archive old bookings
      const bookingsQuery = `
        UPDATE bookings 
        SET is_archived = 1 
        WHERE booking_date < ? AND is_archived = 0
      `;
      const [bookingsResult] = await db.execute(bookingsQuery, [oneYearAgo]);

      logger.info('Old data archived', {
        leads: leadsResult.affectedRows,
        bookings: bookingsResult.affectedRows
      });
    } catch (error) {
      logger.error('Failed to archive old data:', error);
    }
  }

  /**
   * Stop a scheduled task
   * @param {string} name - Task name
   */
  stop(name) {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      logger.info(`Scheduled task stopped: ${name}`);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    this.tasks.forEach((task, name) => {
      task.stop();
      logger.info(`Scheduled task stopped: ${name}`);
    });
    this.tasks.clear();
    logger.info('All scheduled tasks stopped');
  }

  /**
   * Get all scheduled tasks
   */
  getTasks() {
    return Array.from(this.tasks.keys());
  }
}

// Export singleton instance
module.exports = new Scheduler();
