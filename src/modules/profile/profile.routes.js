const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../../middleware/authMiddleware');
const validateRequest = require('../../middleware/validateRequest');
const uploadService = require('../../services/uploadService');

// Configure multer for avatar upload
const avatarUpload = uploadService.getMulterConfig({
  fileSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
});

router.get('/', authMiddleware, profileController.getProfiles);
router.post('/', authMiddleware, validateRequest('profile'), profileController.createProfile);
router.get('/username/:username', profileController.getProfileByUsername);
router.get('/:id', optionalAuthMiddleware, profileController.getProfile);
router.put('/:id', authMiddleware, profileController.updateProfile);
router.delete('/:id', authMiddleware, profileController.deleteProfile);
router.get('/:id/qr', profileController.generateQR);
router.post('/:id/avatar', authMiddleware, avatarUpload.single('file'), profileController.uploadAvatar);
router.post('/:id/links', authMiddleware, profileController.addLink);
router.put('/:id/links/:linkId', authMiddleware, profileController.updateLink);
router.delete('/:id/links/:linkId', authMiddleware, profileController.deleteLink);
router.get('/:id/analytics', authMiddleware, profileController.getAnalytics);
router.post('/:id/view', profileController.trackView);

module.exports = router;
