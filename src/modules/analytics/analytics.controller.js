const { query, queryOne } = require('../../config/database');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');

class AnalyticsController {
  async getDashboard(req, res) {
    const userId = req.user.user_id;

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

    res.json(formatResponse(true, {
      total_profiles: totalProfiles.count,
      total_leads: totalLeads.count,
      total_views: totalViews.count
    }, 'Dashboard data retrieved'));
  }

  async getProfileAnalytics(req, res) {
    const userId = req.user.user_id;
    const { profile_id, days = 30 } = req.query;

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

    res.json(formatResponse(true, { analytics }, 'Analytics retrieved'));
  }

  async getLeadAnalytics(req, res) {
    const userId = req.user.user_id;

    const leadsByStatus = await query(
      `SELECT l.status, COUNT(*) as count
       FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?
       GROUP BY l.status`,
      [userId]
    );

    res.json(formatResponse(true, { leads_by_status: leadsByStatus }, 'Lead analytics retrieved'));
  }

  async getTraffic(req, res) {
    const userId = req.user.user_id;
    const { days = 7 } = req.query;

    const traffic = await query(
      `SELECT DATE(a.created_at) as date, COUNT(*) as count
       FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       WHERE p.user_id = ? AND a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(a.created_at)
       ORDER BY date DESC`,
      [userId, parseInt(days)]
    );

    res.json(formatResponse(true, { traffic }, 'Traffic data retrieved'));
  }

  async getConversions(req, res) {
    const userId = req.user.user_id;

    const conversions = await queryOne(
      `SELECT 
         COUNT(DISTINCT a.profile_id) as profiles_with_views,
         COUNT(DISTINCT l.profile_id) as profiles_with_leads,
         COUNT(DISTINCT l.lead_id) as total_leads
       FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       LEFT JOIN leads l ON p.profile_id = l.profile_id
       WHERE p.user_id = ? AND a.event_type = 'profile_view'`,
      [userId]
    );

    res.json(formatResponse(true, { conversions }, 'Conversion data retrieved'));
  }

  async exportAnalytics(req, res) {
    const userId = req.user.user_id;

    const data = await query(
      `SELECT a.*, p.profile_name
       FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       WHERE p.user_id = ?
       ORDER BY a.created_at DESC
       LIMIT 1000`,
      [userId]
    );

    res.json(formatResponse(true, { data, count: data.length }, 'Analytics exported'));
  }
}

module.exports = new AnalyticsController();
