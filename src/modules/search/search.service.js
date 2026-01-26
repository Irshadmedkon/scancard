const { query } = require('../../config/database');
const logger = require('../../utils/logger');

class SearchService {
  /**
   * Search profiles
   */
  async searchProfiles(searchQuery, limit = 20) {
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
      [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, parseInt(limit)]
    );

    return profiles;
  }

  /**
   * Search leads
   */
  async searchLeads(userId, searchQuery, limit = 20) {
    const leads = await query(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ? AND (
         l.name LIKE ? OR
         l.email LIKE ? OR
         l.company LIKE ?
       )
       LIMIT ?`,
      [userId, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, parseInt(limit)]
    );

    return leads;
  }

  /**
   * Global search (profiles + leads)
   */
  async globalSearch(userId, searchQuery, limit = 10) {
    const profiles = await query(
      `SELECT profile_id, profile_name, username, 'profile' as type
       FROM profiles
       WHERE user_id = ? AND profile_name LIKE ?
       LIMIT ?`,
      [userId, `%${searchQuery}%`, parseInt(limit)]
    );

    const leads = await query(
      `SELECT l.lead_id, l.name, l.email, 'lead' as type
       FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ? AND l.name LIKE ?
       LIMIT ?`,
      [userId, `%${searchQuery}%`, parseInt(limit)]
    );

    return {
      profiles,
      leads
    };
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(searchQuery) {
    const suggestions = await query(
      `SELECT DISTINCT username FROM profiles
       WHERE is_public = TRUE AND username LIKE ?
       LIMIT 5`,
      [`%${searchQuery}%`]
    );

    return suggestions.map(s => s.username);
  }

  /**
   * Search menu items
   */
  async searchMenuItems(profileId, searchQuery) {
    const items = await query(
      `SELECT mi.*, mc.category_name
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mi.profile_id = ? AND mi.is_available = TRUE AND (
         mi.item_name LIKE ? OR
         mi.description LIKE ? OR
         mi.tags LIKE ?
       )
       ORDER BY mi.item_name`,
      [profileId, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
    );

    return items;
  }

  /**
   * Search products
   */
  async searchProducts(profileId, searchQuery) {
    const products = await query(
      `SELECT * FROM product_catalog
       WHERE profile_id = ? AND is_active = TRUE AND (
         product_name LIKE ? OR
         description LIKE ? OR
         tags LIKE ? OR
         category LIKE ?
       )
       ORDER BY product_name`,
      [profileId, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
    );

    return products;
  }
}

module.exports = new SearchService();

