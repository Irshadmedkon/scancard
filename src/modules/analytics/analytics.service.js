const { query, queryOne } = require('../../config/database');
const { cacheService } = require('../../services/cacheService');
const logger = require('../../utils/logger');

class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId) {
    const cacheKey = `analytics:dashboard:${userId}`;

    return await cacheService.getOrSet(cacheKey, async () => {
      const totalProfiles = await queryOne(
        'SELECT COUNT(*) as count FROM profiles WHERE user_id = ?',
        [userId]
      );

      const totalLeads = await queryOne(
        `SELECT COUNT(*) as count FROM leads l
         JOIN profiles p ON l.profile_id = p.profile_id
         WHERE p.user_id = ?`,
        [userId]
      );

      const totalViews = await queryOne(
        `SELECT COUNT(*) as count FROM analytics a
         JOIN profiles p ON a.profile_id = p.profile_id
         WHERE p.user_id = ? AND a.event_type = 'profile_view'`,
        [userId]
      );

      const recentLeads = await query(
        `SELECT l.* FROM leads l
         JOIN profiles p ON l.profile_id = p.profile_id
         WHERE p.user_id = ?
         ORDER BY l.created_at DESC
         LIMIT 5`,
        [userId]
      );

      return {
        total_profiles: totalProfiles.count,
        total_leads: totalLeads.count,
        total_views: totalViews.count,
        recent_leads: recentLeads
      };
    }, 300); // Cache for 5 minutes
  }

  /**
   * Get profile analytics
   */
  async getProfileAnalytics(userId, filters = {}) {
    const { profile_id, days = 30 } = filters;

    let sql = `SELECT DATE(a.created_at) as date, COUNT(*) as views
               FROM analytics a
               JOIN profiles p ON a.profile_id = p.profile_id
               WHERE p.user_id = ? AND a.event_type = 'profile_view'
               AND a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`;
    const params = [userId, parseInt(days)];

    if (profile_id) {
      sql += ' AND a.profile_id = ?';
      params.push(profile_id);
    }

    sql += ' GROUP BY DATE(a.created_at) ORDER BY date DESC';

    const analytics = await query(sql, params);

    return analytics;
  }

  /**
   * Get lead analytics
   */
  async getLeadAnalytics(userId) {
    const leadsByStatus = await query(
      `SELECT l.status, COUNT(*) as count
       FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?
       GROUP BY l.status`,
      [userId]
    );

    const leadsBySource = await query(
      `SELECT l.source, COUNT(*) as count
       FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?
       GROUP BY l.source`,
      [userId]
    );

    const leadsOverTime = await query(
      `SELECT DATE(l.created_at) as date, COUNT(*) as count
       FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ? AND l.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(l.created_at)
       ORDER BY date DESC`,
      [userId]
    );

    return {
      by_status: leadsByStatus,
      by_source: leadsBySource,
      over_time: leadsOverTime
    };
  }

  /**
   * Get traffic analytics
   */
  async getTrafficAnalytics(userId, days = 7) {
    const traffic = await query(
      `SELECT DATE(a.created_at) as date, COUNT(*) as count
       FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       WHERE p.user_id = ? AND a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(a.created_at)
       ORDER BY date DESC`,
      [userId, parseInt(days)]
    );

    return traffic;
  }

  /**
   * Get conversion analytics
   */
  async getConversionAnalytics(userId) {
    const conversions = await queryOne(
      `SELECT 
         COUNT(DISTINCT a.profile_id) as profiles_with_views,
         COUNT(DISTINCT l.profile_id) as profiles_with_leads,
         COUNT(DISTINCT l.lead_id) as total_leads,
         COUNT(DISTINCT a.analytics_id) as total_views
       FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       LEFT JOIN leads l ON p.profile_id = l.profile_id
       WHERE p.user_id = ? AND a.event_type = 'profile_view'`,
      [userId]
    );

    // Calculate conversion rate
    const conversionRate = conversions.total_views > 0 
      ? ((conversions.total_leads / conversions.total_views) * 100).toFixed(2)
      : 0;

    return {
      ...conversions,
      conversion_rate: parseFloat(conversionRate)
    };
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(userId, limit = 1000) {
    const data = await query(
      `SELECT a.*, p.profile_name
       FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       WHERE p.user_id = ?
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return data;
  }

  /**
   * Track custom event
   */
  async trackEvent(profileId, eventType, eventData = null) {
    await query(
      'INSERT INTO analytics (profile_id, event_type, event_data, created_at) VALUES (?, ?, ?, NOW())',
      [profileId, eventType, eventData ? JSON.stringify(eventData) : null]
    );

    logger.info('Event tracked', { profileId, eventType });
  }
}

module.exports = new AnalyticsService();
