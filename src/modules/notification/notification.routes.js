const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, notificationController.getNotifications);
router.post('/', authMiddleware, notificationController.createNotification);
router.get('/:id', authMiddleware, notificationController.getNotification);
router.put('/:id/read', authMiddleware, notificationController.markAsRead);
router.delete('/:id', authMiddleware, notificationController.deleteNotification);

module.exports = router;
