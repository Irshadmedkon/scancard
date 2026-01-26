const { query } = require('../../config/database');
const { formatResponse } = require('../../utils/helpers');

class ExportController {
  async exportProfilesCSV(req, res) {
    const userId = req.user.user_id;

    const profiles = await query(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    // Convert to CSV format
    const csv = this.convertToCSV(profiles);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=profiles.csv');
    res.send(csv);
  }

  async exportProfilesExcel(req, res) {
    const userId = req.user.user_id;

    const profiles = await query(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    res.json(formatResponse(true, { profiles }, 'Profiles data for Excel export'));
  }

  async exportLeadsCSV(req, res) {
    const userId = req.user.user_id;

    const leads = await query(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?`,
      [userId]
    );

    const csv = this.convertToCSV(leads);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.send(csv);
  }

  async exportLeadsExcel(req, res) {
    const userId = req.user.user_id;

    const leads = await query(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?`,
      [userId]
    );

    res.json(formatResponse(true, { leads }, 'Leads data for Excel export'));
  }

  async exportAnalyticsPDF(req, res) {
    const userId = req.user.user_id;

    const analytics = await query(
      `SELECT a.* FROM analytics a
       JOIN profiles p ON a.profile_id = p.profile_id
       WHERE p.user_id = ?
       LIMIT 1000`,
      [userId]
    );

    res.json(formatResponse(true, { analytics }, 'Analytics data for PDF export'));
  }

  async generateReport(req, res) {
    const userId = req.user.user_id;
    const { report_type } = req.query;

    let data = {};

    if (report_type === 'summary') {
      const profiles = await query('SELECT COUNT(*) as count FROM profiles WHERE user_id = ?', [userId]);
      const leads = await query(
        `SELECT COUNT(*) as count FROM leads l
         JOIN profiles p ON l.profile_id = p.profile_id
         WHERE p.user_id = ?`,
        [userId]
      );

      data = {
        total_profiles: profiles[0].count,
        total_leads: leads[0].count
      };
    }

    res.json(formatResponse(true, { report: data }, 'Report generated'));
  }

  convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');

    return `${headers}\n${rows}`;
  }
}

module.exports = new ExportController();
