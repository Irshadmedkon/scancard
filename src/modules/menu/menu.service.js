const { query, queryOne } = require('../../config/database');
const { cacheService } = require('../../services/cacheService');
const logger = require('../../utils/logger');

class MenuService {
  /**
   * Get full menu (public)
   */
  async getFullMenu(profileId) {
    const cacheKey = `menu:${profileId}:full`;

    return await cacheService.getOrSet(cacheKey, async () => {
      const categories = await query(
        `SELECT * FROM menu_categories 
         WHERE profile_id = ? AND is_active = TRUE 
         ORDER BY display_order`,
        [profileId]
      );

      for (const category of categories) {
        category.items = await query(
          `SELECT * FROM menu_items 
           WHERE category_id = ? AND is_available = TRUE 
           ORDER BY display_order`,
          [category.category_id]
        );
      }

      return categories;
    }, 600); // Cache for 10 minutes
  }

  /**
   * Get categories
   */
  async getCategories(profileId) {
    return await query(
      `SELECT * FROM menu_categories 
       WHERE profile_id = ? AND is_active = TRUE 
       ORDER BY display_order`,
      [profileId]
    );
  }

  /**
   * Get menu items by category
   */
  async getMenuItems(profileId, categoryId) {
    return await query(
      `SELECT mi.* FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mc.profile_id = ? AND mi.category_id = ? AND mi.is_available = TRUE
       ORDER BY mi.display_order`,
      [profileId, categoryId]
    );
  }

  /**
   * Create category
   */
  async createCategory(profileId, userId, categoryData) {
    const { category_name, description, display_order } = categoryData;

    const result = await query(
      `INSERT INTO menu_categories (profile_id, category_name, description, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [profileId, category_name, description || null, display_order || 0]
    );

    await cacheService.del(`menu:${profileId}:full`);

    return await queryOne('SELECT * FROM menu_categories WHERE category_id = ?', [result.insertId]);
  }

  /**
   * Update category
   */
  async updateCategory(profileId, categoryId, userId, updates) {
    const category = await queryOne(
      'SELECT * FROM menu_categories WHERE category_id = ? AND profile_id = ?',
      [categoryId, profileId]
    );

    if (!category) {
      throw new Error('Category not found');
    }

    const allowedFields = ['category_name', 'description', 'display_order', 'is_active'];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateValues.push(categoryId);
      await query(`UPDATE menu_categories SET ${updateFields.join(', ')} WHERE category_id = ?`, updateValues);
    }

    await cacheService.del(`menu:${profileId}:full`);

    return await queryOne('SELECT * FROM menu_categories WHERE category_id = ?', [categoryId]);
  }

  /**
   * Delete category
   */
  async deleteCategory(profileId, categoryId, userId) {
    const category = await queryOne(
      'SELECT * FROM menu_categories WHERE category_id = ? AND profile_id = ?',
      [categoryId, profileId]
    );

    if (!category) {
      throw new Error('Category not found');
    }

    await query('DELETE FROM menu_categories WHERE category_id = ?', [categoryId]);
    await cacheService.del(`menu:${profileId}:full`);

    logger.info('Menu category deleted', { categoryId, profileId });
  }

  /**
   * Create menu item
   */
  async createMenuItem(profileId, userId, itemData) {
    const { category_id, item_name, description, price, discount_price, is_veg, preparation_time, calories, tags, display_order } = itemData;

    // Verify category belongs to profile
    const category = await queryOne(
      'SELECT * FROM menu_categories WHERE category_id = ? AND profile_id = ?',
      [category_id, profileId]
    );

    if (!category) {
      throw new Error('Category not found');
    }

    const result = await query(
      `INSERT INTO menu_items (category_id, item_name, description, price, discount_price, is_veg, preparation_time, calories, tags, display_order, is_available, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
      [category_id, item_name, description || null, price, discount_price || null, is_veg !== false, preparation_time || null, calories || null, tags || null, display_order || 0]
    );

    await cacheService.del(`menu:${profileId}:full`);

    return await queryOne('SELECT * FROM menu_items WHERE item_id = ?', [result.insertId]);
  }

  /**
   * Update menu item
   */
  async updateMenuItem(profileId, itemId, userId, updates) {
    // Verify item exists and belongs to user's profile through category
    const item = await queryOne(
      `SELECT mi.* FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mi.item_id = ? AND mc.profile_id = ?`,
      [itemId, profileId]
    );

    if (!item) {
      throw new Error('Menu item not found');
    }

    const allowedFields = ['item_name', 'description', 'price', 'discount_price', 'is_veg', 'is_available', 'preparation_time', 'calories', 'tags', 'display_order'];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateValues.push(itemId);
      await query(`UPDATE menu_items SET ${updateFields.join(', ')} WHERE item_id = ?`, updateValues);
    }

    await cacheService.del(`menu:${profileId}:full`);

    return await queryOne('SELECT * FROM menu_items WHERE item_id = ?', [itemId]);
  }

  /**
   * Delete menu item
   */
  async deleteMenuItem(profileId, itemId, userId) {
    // Verify item exists and belongs to user's profile through category
    const item = await queryOne(
      `SELECT mi.* FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mi.item_id = ? AND mc.profile_id = ?`,
      [itemId, profileId]
    );

    if (!item) {
      throw new Error('Menu item not found');
    }

    await query('DELETE FROM menu_items WHERE item_id = ?', [itemId]);
    await cacheService.del(`menu:${profileId}:full`);

    logger.info('Menu item deleted', { itemId, profileId });
  }

  /**
   * Toggle item availability
   */
  async toggleAvailability(profileId, itemId, userId) {
    // Verify item exists and belongs to user's profile through category
    const item = await queryOne(
      `SELECT mi.* FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mi.item_id = ? AND mc.profile_id = ?`,
      [itemId, profileId]
    );

    if (!item) {
      throw new Error('Menu item not found');
    }

    await query(
      'UPDATE menu_items SET is_available = NOT is_available, updated_at = NOW() WHERE item_id = ?',
      [itemId]
    );

    await cacheService.del(`menu:${profileId}:full`);

    return await queryOne('SELECT * FROM menu_items WHERE item_id = ?', [itemId]);
  }

  /**
   * Upload menu item image
   */
  async uploadItemImage(itemId, profileId, userId, file) {
    // Verify ownership
    const item = await queryOne(
      `SELECT mi.* FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.category_id
       JOIN profiles p ON mc.profile_id = p.profile_id
       WHERE mi.item_id = ? AND mc.profile_id = ? AND p.user_id = ?`,
      [itemId, profileId, userId]
    );

    if (!item) {
      throw new Error('Menu item not found');
    }

    const uploadService = require('../../services/uploadService');
    const result = await uploadService.upload(file, {
      userId,
      storage: 'local',
      subfolder: 'menu-items',
      resize: true,
      width: 800,
      height: 800
    });

    // Update menu item with new image
    await query(
      'UPDATE menu_items SET image_url = ?, updated_at = NOW() WHERE item_id = ?',
      [result.data.url, itemId]
    );

    await cacheService.del(`menu:${profileId}:full`);

    return await queryOne('SELECT * FROM menu_items WHERE item_id = ?', [itemId]);
  }
}

module.exports = new MenuService();
