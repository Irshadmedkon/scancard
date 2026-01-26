const catalogService = require('./catalog.service');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES, ERROR_CODES } = require('../../utils/constants');
const logger = require('../../utils/logger');

class CatalogController {
  async createProduct(req, res) {
    try {
      const profileId = req.params.profileId;
      const userId = req.user.user_id;
      const result = await catalogService.createProduct(profileId, userId, req.body);
      res.status(STATUS_CODES.CREATED).json(formatResponse(true, result, 'Product created successfully'));
    } catch (error) {
      logger.error('Create product controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(false, null, '', {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error.message
      }));
    }
  }

  async getProducts(req, res) {
    try {
      const { category, in_stock_only, search } = req.query;
      const products = await catalogService.getProducts(req.params.profileId, {
        category,
        in_stock_only: in_stock_only === 'true',
        search
      });
      res.json(formatResponse(true, { products }, 'Products retrieved successfully'));
    } catch (error) {
      logger.error('Get products controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(false, null, '', {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to retrieve products'
      }));
    }
  }

  async getProduct(req, res) {
    try {
      const product = await catalogService.getProduct(req.params.profileId, req.params.productId);
      res.json(formatResponse(true, { product }, 'Product retrieved successfully'));
    } catch (error) {
      logger.error('Get product controller error:', error);
      res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(false, null, '', {
        code: ERROR_CODES.NOT_FOUND,
        message: error.message
      }));
    }
  }

  async updateProduct(req, res) {
    try {
      const { productId, profileId } = req.params;
      const userId = req.user.user_id;
      const result = await catalogService.updateProduct(profileId, productId, userId, req.body);
      res.json(formatResponse(true, result, 'Product updated successfully'));
    } catch (error) {
      logger.error('Update product controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(false, null, '', {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error.message
      }));
    }
  }

  async deleteProduct(req, res) {
    try {
      const { productId, profileId } = req.params;
      const userId = req.user.user_id;
      const result = await catalogService.deleteProduct(profileId, productId, userId);
      res.json(formatResponse(true, result, 'Product deleted successfully'));
    } catch (error) {
      logger.error('Delete product controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(false, null, '', {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }));
    }
  }

  async addProductImage(req, res) {
    try {
      // Simple URL-based image addition
      const { image_url, is_primary = false, display_order = 0 } = req.body;
      
      if (!image_url) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(false, null, '', {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'image_url is required'
        }));
      }
      
      const result = await catalogService.addProductImage(
        req.params.productId,
        image_url,
        is_primary,
        display_order
      );
      res.status(STATUS_CODES.CREATED).json(formatResponse(true, result, 'Image added successfully'));
    } catch (error) {
      logger.error('Add product image controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(false, null, '', {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error.message
      }));
    }
  }

  async deleteProductImage(req, res) {
    try {
      const result = await catalogService.deleteProductImage(
        req.params.imageId,
        req.params.productId
      );
      res.json(formatResponse(true, result, 'Image deleted successfully'));
    } catch (error) {
      logger.error('Delete product image controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(false, null, '', {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }));
    }
  }

  async getLowStockProducts(req, res) {
    try {
      const products = await catalogService.getLowStockProducts(req.params.profileId);
      res.json(formatResponse(true, { products }, 'Low stock products retrieved successfully'));
    } catch (error) {
      logger.error('Get low stock products controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(false, null, '', {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to retrieve low stock products'
      }));
    }
  }

  async updateStock(req, res) {
    try {
      const { productId, profileId } = req.params;
      const userId = req.user.user_id;
      
      const result = await catalogService.updateStock(profileId, productId, userId, req.body);
      
      res.json(formatResponse(true, result, 'Stock updated successfully'));
    } catch (error) {
      logger.error('Update stock controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(false, null, '', {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error.message
      }));
    }
  }

  async searchProducts(req, res) {
    try {
      const { q, category, limit = 20 } = req.query;
      const profileId = req.params.profileId;
      
      const products = await catalogService.searchProducts(profileId, {
        query: q,
        category,
        limit: parseInt(limit)
      });
      
      res.json(formatResponse(true, { products, count: products.length }, 'Products found'));
    } catch (error) {
      logger.error('Search products controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(false, null, '', {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to search products'
      }));
    }
  }
}

module.exports = new CatalogController();
