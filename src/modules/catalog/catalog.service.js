const { query, queryOne } = require('../../config/database');
const { cacheService } = require('../../services/cacheService');
const logger = require('../../utils/logger');

class CatalogService {
  async getProducts(profileId, filters = {}) {
    const { category, in_stock_only, search } = filters;
    
    let sql = 'SELECT * FROM product_catalog WHERE profile_id = ? AND is_active = TRUE';
    const params = [profileId];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (in_stock_only === 'true') {
      sql += ' AND stock_quantity > 0';
    }

    if (search) {
      sql += ' AND (product_name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    return await query(sql, params);
  }

  async getProduct(profileId, productId) {
    const product = await queryOne(
      'SELECT * FROM product_catalog WHERE product_id = ? AND profile_id = ?',
      [productId, profileId]
    );

    if (!product) {
      throw new Error('Product not found');
    }

    product.images = await query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order',
      [productId]
    );

    return product;
  }

  async createProduct(profileId, userId, productData) {
    const { product_name, description, sku, price, discount_price, stock_quantity, category, brand, tags } = productData;

    const result = await query(
      `INSERT INTO product_catalog (profile_id, product_name, description, sku, price, discount_price, stock_quantity, category, brand, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [profileId, product_name, description || null, sku || null, price, discount_price || null, stock_quantity || 0, category || null, brand || null, tags || null]
    );

    return await queryOne('SELECT * FROM product_catalog WHERE product_id = ?', [result.insertId]);
  }

  async updateProduct(profileId, productId, userId, updates) {
    const product = await queryOne(
      'SELECT * FROM product_catalog WHERE product_id = ? AND profile_id = ?',
      [productId, profileId]
    );

    if (!product) {
      throw new Error('Product not found');
    }

    const allowedFields = ['product_name', 'description', 'sku', 'price', 'discount_price', 'stock_quantity', 'category', 'brand', 'tags', 'is_active'];
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
      updateValues.push(productId);
      await query(`UPDATE product_catalog SET ${updateFields.join(', ')} WHERE product_id = ?`, updateValues);
    }

    return await queryOne('SELECT * FROM product_catalog WHERE product_id = ?', [productId]);
  }

  async deleteProduct(profileId, productId, userId) {
    const product = await queryOne(
      'SELECT * FROM product_catalog WHERE product_id = ? AND profile_id = ?',
      [productId, profileId]
    );

    if (!product) {
      throw new Error('Product not found');
    }

    await query('DELETE FROM product_catalog WHERE product_id = ?', [productId]);
    logger.info('Product deleted', { productId, profileId });
  }

  async updateStock(profileId, productId, userId, stockData) {
    const product = await queryOne(
      'SELECT * FROM product_catalog WHERE product_id = ? AND profile_id = ?',
      [productId, profileId]
    );

    if (!product) {
      throw new Error('Product not found');
    }

    // Handle both formats: {action, quantity} and {stock_quantity}
    let sql;
    let params;

    if (stockData.stock_quantity !== undefined) {
      // Direct stock quantity update
      sql = 'UPDATE product_catalog SET stock_quantity = ?, updated_at = NOW() WHERE product_id = ?';
      params = [stockData.stock_quantity, productId];
    } else if (stockData.action && stockData.quantity !== undefined) {
      // Action-based update
      const { action, quantity } = stockData;
      
      if (action === 'set') {
        sql = 'UPDATE product_catalog SET stock_quantity = ?, updated_at = NOW() WHERE product_id = ?';
        params = [quantity, productId];
      } else if (action === 'add') {
        sql = 'UPDATE product_catalog SET stock_quantity = stock_quantity + ?, updated_at = NOW() WHERE product_id = ?';
        params = [quantity, productId];
      } else if (action === 'subtract') {
        sql = 'UPDATE product_catalog SET stock_quantity = GREATEST(stock_quantity - ?, 0), updated_at = NOW() WHERE product_id = ?';
        params = [quantity, productId];
      } else {
        throw new Error('Invalid action. Use "set", "add", or "subtract"');
      }
    } else {
      throw new Error('Either stock_quantity or action+quantity must be provided');
    }

    await query(sql, params);
    
    const updatedProduct = await queryOne('SELECT * FROM product_catalog WHERE product_id = ?', [productId]);
    
    logger.info('Stock updated', { 
      productId, 
      profileId, 
      oldStock: product.stock_quantity, 
      newStock: updatedProduct.stock_quantity,
      userId 
    });

    return updatedProduct;
  }

  async getLowStockProducts(profileId, userId) {
    return await query(
      'SELECT * FROM product_catalog WHERE profile_id = ? AND stock_quantity <= low_stock_threshold AND is_active = TRUE',
      [profileId]
    );
  }

  async addProductImage(productId, imageUrl, isPrimary = false, displayOrder = 0) {
    // If this is set as primary, unset other primary images for this product
    if (isPrimary) {
      await query(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
        [productId]
      );
    }

    const result = await query(
      'INSERT INTO product_images (product_id, image_url, is_primary, display_order, created_at) VALUES (?, ?, ?, ?, NOW())',
      [productId, imageUrl, isPrimary ? 1 : 0, displayOrder]
    );

    return await queryOne(
      'SELECT * FROM product_images WHERE image_id = ?',
      [result.insertId]
    );
  }

  async deleteProductImage(imageId, productId) {
    // Verify image belongs to product
    const image = await queryOne(
      'SELECT * FROM product_images WHERE image_id = ? AND product_id = ?',
      [imageId, productId]
    );

    if (!image) {
      throw new Error('Image not found');
    }

    await query('DELETE FROM product_images WHERE image_id = ?', [imageId]);
    
    logger.info('Product image deleted', { imageId, productId });
  }

  async searchProducts(profileId, filters = {}) {
    try {
      const { query: searchQuery, category, limit = 20 } = filters;
      
      // Convert limit to integer
      const limitNum = parseInt(limit) || 20;
      
      let sql = 'SELECT * FROM product_catalog WHERE profile_id = ? AND is_active = TRUE';
      const params = [profileId];

      if (searchQuery) {
        sql += ' AND (product_name LIKE ? OR description LIKE ? OR category LIKE ? OR brand LIKE ? OR tags LIKE ?)';
        const searchTerm = `%${searchQuery}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (category) {
        sql += ' AND category = ?';
        params.push(category);
      }

      // Use string concatenation for LIMIT instead of prepared statement parameter
      sql += ` ORDER BY created_at DESC LIMIT ${limitNum}`;

      logger.info('Search products query', { sql, params, profileId, filters });

      return await query(sql, params);
    } catch (error) {
      logger.error('Search products error:', error);
      throw error;
    }
  }
}

module.exports = new CatalogService();
