const { query, queryOne } = require('../../config/database');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');
const logger = require('../../utils/logger');

class StatsController {
  /**
   * GET /api/v1/stats/dashboard
   */
  async getDashboard(req, res) {
    const userId = req.user.user_id;

    // Get total profiles
    const profileStats = await queryOne(
      'SELECT COUNT(*) as total FROM profiles WHERE user_id = ?',
      [userId]
    );

    // Get total leads
    const leadStats = await queryOne(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
              SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
              SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
       FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?`,
      [userId]
    );

    // Get total views
    const viewStats = await queryOne(
      `SELECT COUNT(*) as total_views
       FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       WHERE p.user_id = ? AND a.event_type = 'profile_view'`,
      [userId]
    );

    // Get recent activity
    const recentLeads = await query(
      `SELECT l.lead_id, l.name, l.email, l.status, l.created_at
       FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?
       ORDER BY l.created_at DESC
       LIMIT 5`,
      [userId]
    );

    const dashboard = {
      profiles: {
        total: profileStats.total
      },
      leads: {
        total: leadStats.total || 0,
        new: leadStats.new_leads || 0,
        contacted: leadStats.contacted || 0,
        converted: leadStats.converted || 0
      },
      views: {
        total: viewStats.total_views || 0
      },
      recent_leads: recentLeads
    };

    res.json(formatResponse(true, dashboard, 'Dashboard stats retrieved'));
  }

  /**
   * GET /api/v1/stats/profile/:profile_id
   */
  async getProfileStats(req, res) {
    const { profile_id } = req.params;
    const userId = req.user.user_id;

    // Verify ownership
    const profile = await queryOne(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [profile_id, userId]
    );

    if (!profile) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Profile not found' }
      ));
    }

    // Get profile views
    const views = await queryOne(
      'SELECT COUNT(*) as total FROM analytics WHERE profile_id = ? AND event_type = ?',
      [profile_id, 'profile_view']
    );

    // Get link clicks
    const clicks = await queryOne(
      'SELECT COUNT(*) as total FROM analytics WHERE profile_id = ? AND event_type = ?',
      [profile_id, 'link_click']
    );

    // Get leads
    const leads = await queryOne(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
              SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
       FROM leads WHERE profile_id = ?`,
      [profile_id]
    );

    // Get views by date (last 7 days)
    const viewsByDate = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM analytics
       WHERE profile_id = ? AND event_type = 'profile_view'
         AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [profile_id]
    );

    const stats = {
      views: {
        total: views.total || 0,
        by_date: viewsByDate
      },
      clicks: {
        total: clicks.total || 0
      },
      leads: {
        total: leads.total || 0,
        new: leads.new_leads || 0,
        converted: leads.converted || 0,
        conversion_rate: leads.total > 0 ? ((leads.converted / leads.total) * 100).toFixed(2) : 0
      }
    };

    res.json(formatResponse(true, stats, 'Profile stats retrieved'));
  }
}

module.exports = new StatsController();
