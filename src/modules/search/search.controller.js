const { query } = require('../../config/database');
const { formatResponse } = require('../../utils/helpers');

class SearchController {
  async searchProfiles(req, res) {
    const { q, limit = 20 } = req.query;

    const profiles = await query(
      `SELECT profile_id, profile_name, username, bio, company, profile_picture
       FROM profiles
       WHERE is_public = TRUE AND (
         profile_name LIKE ? OR
         username LIKE ? OR
         bio LIKE ? OR
         company LIKE ?
       )
       LIMIT ?`,
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, parseInt(limit)]
    );

    res.json(formatResponse(true, { profiles, count: profiles.length }, 'Profiles found'));
  }

  async searchLeads(req, res) {
    const userId = req.user.user_id;
    const { q, limit = 20 } = req.query;

    const leads = await query(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ? AND (
         l.name LIKE ? OR
         l.email LIKE ? OR
         l.company LIKE ?
       )
       LIMIT ?`,
      [userId, `%${q}%`, `%${q}%`, `%${q}%`, parseInt(limit)]
    );

    res.json(formatResponse(true, { leads, count: leads.length }, 'Leads found'));
  }

  async globalSearch(req, res) {
    const userId = req.user.user_id;
    const { q, limit = 10 } = req.query;

    const profiles = await query(
      `SELECT profile_id, profile_name, username FROM profiles
       WHERE user_id = ? AND profile_name LIKE ?
       LIMIT ?`,
      [userId, `%${q}%`, parseInt(limit)]
    );

    const leads = await query(
      `SELECT l.lead_id, l.name, l.email FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ? AND l.name LIKE ?
       LIMIT ?`,
      [userId, `%${q}%`, parseInt(limit)]
    );

    res.json(formatResponse(true, { profiles, leads }, 'Search results'));
  }

  async getSuggestions(req, res) {
    const { q } = req.query;

    const suggestions = await query(
      `SELECT DISTINCT username FROM profiles
       WHERE is_public = TRUE AND username LIKE ?
       LIMIT 5`,
      [`%${q}%`]
    );

    res.json(formatResponse(true, { suggestions: suggestions.map(s => s.username) }, 'Suggestions retrieved'));
  }
}

module.exports = new SearchController();

