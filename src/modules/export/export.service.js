const { query } = require('../../config/database');
const logger = require('../../utils/logger');

class ExportService {
  /**
   * Export profiles to CSV
   */
  async exportProfiles(userId) {
    const profiles = await query(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    return this.convertToCSV(profiles);
  }

  /**
   * Export leads to CSV
   */
  async exportLeads(userId) {
    const leads = await query(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?`,
      [userId]
    );

    return this.convertToCSV(leads);
  }

  /**
   * Export analytics to CSV
   */
  async exportAnalytics(userId) {
    const analytics = await query(
      `SELECT a.*, p.profile_name
       FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       WHERE p.user_id = ?
       LIMIT 1000`,
      [userId]
    );

    return this.convertToCSV(analytics);
  }

  /**
   * Get profiles data for Excel
   */
  async getProfilesData(userId) {
    const profiles = await query(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    return profiles;
  }

  /**
   * Get leads data for Excel
   */
  async getLeadsData(userId) {
    const leads = await query(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?`,
      [userId]
    );

    return leads;
  }

  /**
   * Get analytics data for PDF
   */
  async getAnalyticsData(userId) {
    const analytics = await query(
      `SELECT a.*, p.profile_name
       FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       WHERE p.user_id = ?
       LIMIT 1000`,
      [userId]
    );

    return analytics;
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport(userId) {
    const profileCount = await query(
      'SELECT COUNT(*) as count FROM profiles WHERE user_id = ?',
      [userId]
    );

    const leadCount = await query(
      `SELECT COUNT(*) as count FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?`,
      [userId]
    );

    const viewCount = await query(
      `SELECT COUNT(*) as count FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       WHERE p.user_id = ? AND a.event_type = 'profile_view'`,
      [userId]
    );

    return {
      total_profiles: profileCount[0].count,
      total_leads: leadCount[0].count,
      total_views: viewCount[0].count,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => {
        // Handle null values
        if (val === null) return '';
        // Escape quotes and wrap in quotes if contains comma
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(',')
    ).join('\n');

    return `${headers}\n${rows}`;
  }

  /**
   * Export menu to CSV
   */
  async exportMenu(profileId, userId) {
    // Verify ownership
    const profile = await query(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [profileId, userId]
    );

    if (profile.length === 0) {
      throw new Error('Profile not found');
    }

    const menuItems = await query(
      `SELECT mi.*, mc.category_name
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mi.profile_id = ?
       ORDER BY mc.display_order, mi.display_order`,
      [profileId]
    );

    return this.convertToCSV(menuItems);
  }

  /**
   * Export catalog to CSV
   */
  async exportCatalog(profileId, userId) {
    // Verify ownership
    const profile = await query(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [profileId, userId]
    );

    if (profile.length === 0) {
      throw new Error('Profile not found');
    }

    const products = await query(
      'SELECT * FROM product_catalog WHERE profile_id = ? ORDER BY product_name',
      [profileId]
    );

    return this.convertToCSV(products);
  }
}

module.exports = new ExportService();
