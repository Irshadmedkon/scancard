const menuService = require('./menu.service');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES, ERROR_CODES } = require('../../utils/constants');
const logger = require('../../utils/logger');

class MenuController {
  // ============================================
  // CATEGORY CONTROLLERS
  // ============================================

  async createCategory(req, res) {
    try {
      const profileId = req.params.profileId;
      const userId = req.user.user_id;
      
      const result = await menuService.createCategory(profileId, userId, req.body);
      
      res.status(STATUS_CODES.CREATED).json(formatResponse(
        true,
        result,
        'Menu category created successfully'
      ));
    } catch (error) {
      logger.error('Create category controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message
        }
      ));
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await menuService.getCategories(req.params.profileId);
      
      res.json(formatResponse(
        true,
        { categories },
        'Categories retrieved successfully'
      ));
    } catch (error) {
      logger.error('Get categories controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to retrieve categories'
        }
      ));
    }
  }

  async updateCategory(req, res) {
    try {
      const { categoryId, profileId } = req.params;
      const userId = req.user.user_id;
      
      const result = await menuService.updateCategory(profileId, categoryId, userId, req.body);
      
      res.json(formatResponse(
        true,
        result,
        'Category updated successfully'
      ));
    } catch (error) {
      logger.error('Update category controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message
        }
      ));
    }
  }

  async deleteCategory(req, res) {
    try {
      const { categoryId, profileId } = req.params;
      const userId = req.user.user_id;
      
      const result = await menuService.deleteCategory(profileId, categoryId, userId);
      
      res.json(formatResponse(
        true,
        result,
        'Category deleted successfully'
      ));
    } catch (error) {
      logger.error('Delete category controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: error.message
        }
      ));
    }
  }

  // ============================================
  // MENU ITEM CONTROLLERS
  // ============================================

  async createMenuItem(req, res) {
    try {
      const profileId = req.params.profileId;
      const userId = req.user.user_id;
      
      const result = await menuService.createMenuItem(profileId, userId, req.body);
      
      res.status(STATUS_CODES.CREATED).json(formatResponse(
        true,
        result,
        'Menu item created successfully'
      ));
    } catch (error) {
      logger.error('Create menu item controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message
        }
      ));
    }
  }

  async getMenuItems(req, res) {
    try {
      const { categoryId, profileId } = req.params;
      
      const items = await menuService.getMenuItems(categoryId, profileId);
      
      res.json(formatResponse(
        true,
        { items },
        'Menu items retrieved successfully'
      ));
    } catch (error) {
      logger.error('Get menu items controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to retrieve menu items'
        }
      ));
    }
  }

  async getFullMenu(req, res) {
    try {
      const menu = await menuService.getFullMenu(req.params.profileId);
      
      res.json(formatResponse(
        true,
        { menu },
        'Full menu retrieved successfully'
      ));
    } catch (error) {
      logger.error('Get full menu controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to retrieve menu'
        }
      ));
    }
  }

  async updateMenuItem(req, res) {
    try {
      const { itemId, profileId } = req.params;
      const userId = req.user.user_id;
      
      const result = await menuService.updateMenuItem(profileId, itemId, userId, req.body);
      
      res.json(formatResponse(
        true,
        result,
        'Menu item updated successfully'
      ));
    } catch (error) {
      logger.error('Update menu item controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message
        }
      ));
    }
  }

  async deleteMenuItem(req, res) {
    try {
      const { itemId, profileId } = req.params;
      const userId = req.user.user_id;
      
      const result = await menuService.deleteMenuItem(profileId, itemId, userId);
      
      res.json(formatResponse(
        true,
        result,
        'Menu item deleted successfully'
      ));
    } catch (error) {
      logger.error('Delete menu item controller error:', error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: error.message
        }
      ));
    }
  }

  async toggleAvailability(req, res) {
    try {
      const { itemId, profileId } = req.params;
      const userId = req.user.user_id;
      const { is_available } = req.body;
      
      const result = await menuService.toggleAvailability(profileId, itemId, userId);
      
      res.json(formatResponse(
        true,
        result,
        'Item availability updated successfully'
      ));
    } catch (error) {
      logger.error('Toggle availability controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message
        }
      ));
    }
  }

  async uploadItemImage(req, res) {
    try {
      const { itemId, profileId } = req.params;
      const userId = req.user.user_id;

      if (!req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
          false,
          null,
          '',
          { code: 'FILE_REQUIRED', message: 'Image file is required' }
        ));
      }

      const result = await menuService.uploadItemImage(itemId, profileId, userId, req.file);

      res.json(formatResponse(
        true,
        result,
        'Menu item image uploaded successfully'
      ));
    } catch (error) {
      logger.error('Upload item image controller error:', error);
      res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message
        }
      ));
    }
  }
}

module.exports = new MenuController();
