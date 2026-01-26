const express = require('express');
const router = express.Router();
const uploadController = require('./upload.controller');
const uploadService = require('../../services/uploadService');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { moderateLimiter } = require('../../middleware/rateLimiter');

// Configure multer for different file types
const imageUpload = uploadService.getMulterConfig({
  fileSize: 5 * 1024 * 1024, // 5MB for images
  allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
});

const documentUpload = uploadService.getMulterConfig({
  fileSize: 10 * 1024 * 1024, // 10MB for documents
  allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
});

/**
 * @route   POST /api/v1/upload/profile-picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post(
  '/profile-picture',
  authMiddleware,
  moderateLimiter,
  imageUpload.single('file'),
  uploadController.uploadProfilePicture
);

/**
 * @route   POST /api/v1/upload/cover-image
 * @desc    Upload cover image
 * @access  Private
 */
router.post(
  '/cover-image',
  authMiddleware,
  moderateLimiter,
  imageUpload.single('file'),
  uploadController.uploadCoverImage
);

/**
 * @route   POST /api/v1/upload/company-logo
 * @desc    Upload company logo
 * @access  Private
 */
router.post(
  '/company-logo',
  authMiddleware,
  moderateLimiter,
  imageUpload.single('file'),
  uploadController.uploadCompanyLogo
);

/**
 * @route   POST /api/v1/upload/document
 * @desc    Upload document
 * @access  Private
 */
router.post(
  '/document',
  authMiddleware,
  moderateLimiter,
  documentUpload.single('file'),
  uploadController.uploadDocument
);

/**
 * @route   POST /api/v1/upload/menu-item-image
 * @desc    Upload menu item image
 * @access  Private
 */
router.post(
  '/menu-item-image',
  authMiddleware,
  moderateLimiter,
  imageUpload.single('file'),
  uploadController.uploadMenuItemImage
);

/**
 * @route   POST /api/v1/upload/product-image
 * @desc    Upload product image
 * @access  Private
 */
router.post(
  '/product-image',
  authMiddleware,
  moderateLimiter,
  imageUpload.single('file'),
  uploadController.uploadProductImage
);

/**
 * @route   DELETE /api/v1/upload/:fileName
 * @desc    Delete uploaded file
 * @access  Private
 */
router.delete(
  '/:fileName',
  authMiddleware,
  uploadController.deleteFile
);

/**
 * @route   GET /api/v1/upload/info/:fileName
 * @desc    Get file information
 * @access  Private
 */
router.get(
  '/info/:fileName',
  authMiddleware,
  uploadController.getFileInfo
);

module.exports = router;