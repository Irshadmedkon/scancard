const express = require('express');
const router = express.Router();
const menuController = require('./menu.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { checkFeatureAccess, checkLimit } = require('../../middleware/subscriptionCheck');
const validateRequest = require('../../middleware/validateRequest');
const uploadService = require('../../services/uploadService');

// Configure multer for menu item image upload
const menuImageUpload = uploadService.getMulterConfig({
  fileSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
});

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

/**
 * Get full menu (public)
 * GET /api/v1/menu/:profileId
 */
router.get('/:profileId', menuController.getFullMenu);

/**
 * Get categories (public)
 * GET /api/v1/menu/:profileId/categories
 */
router.get('/:profileId/categories', menuController.getCategories);

/**
 * Get items by category (public)
 * GET /api/v1/menu/:profileId/categories/:categoryId/items
 */
router.get('/:profileId/categories/:categoryId/items', menuController.getMenuItems);

// ============================================
// PROTECTED ROUTES (Auth + Feature Check)
// ============================================

/**
 * Create category
 * POST /api/v1/menu/:profileId/categories
 */
router.post(
  '/:profileId/categories',
  authMiddleware,
  checkFeatureAccess('menu'),
  validateRequest('menuCategory'),
  menuController.createCategory
);

/**
 * Update category
 * PUT /api/v1/menu/:profileId/categories/:categoryId
 */
router.put(
  '/:profileId/categories/:categoryId',
  authMiddleware,
  checkFeatureAccess('menu'),
  menuController.updateCategory
);

/**
 * Delete category
 * DELETE /api/v1/menu/:profileId/categories/:categoryId
 */
router.delete(
  '/:profileId/categories/:categoryId',
  authMiddleware,
  checkFeatureAccess('menu'),
  menuController.deleteCategory
);

/**
 * Create menu item
 * POST /api/v1/menu/:profileId/items
 */
router.post(
  '/:profileId/items',
  authMiddleware,
  checkFeatureAccess('menu'),
  checkLimit('menu_items', 100),
  validateRequest('menuItem'),
  menuController.createMenuItem
);

/**
 * Update menu item
 * PUT /api/v1/menu/:profileId/items/:itemId
 */
router.put(
  '/:profileId/items/:itemId',
  authMiddleware,
  checkFeatureAccess('menu'),
  menuController.updateMenuItem
);

/**
 * Delete menu item
 * DELETE /api/v1/menu/:profileId/items/:itemId
 */
router.delete(
  '/:profileId/items/:itemId',
  authMiddleware,
  checkFeatureAccess('menu'),
  menuController.deleteMenuItem
);

/**
 * Toggle item availability
 * PATCH /api/v1/menu/:profileId/items/:itemId/availability
 */
router.patch(
  '/:profileId/items/:itemId/availability',
  authMiddleware,
  checkFeatureAccess('menu'),
  menuController.toggleAvailability
);

/**
 * Upload menu item image
 * POST /api/v1/menu/:profileId/items/:itemId/image
 */
router.post(
  '/:profileId/items/:itemId/image',
  authMiddleware,
  checkFeatureAccess('menu'),
  menuImageUpload.single('file'),
  menuController.uploadItemImage
);

module.exports = router;
