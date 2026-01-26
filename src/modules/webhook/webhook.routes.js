const express = require('express');
const router = express.Router();
const webhookController = require('./webhook.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, webhookController.getWebhooks);
router.post('/', authMiddleware, webhookController.createWebhook);
router.get('/:id', authMiddleware, webhookController.getWebhook);
router.put('/:id', authMiddleware, webhookController.updateWebhook);
router.delete('/:id', authMiddleware, webhookController.deleteWebhook);
router.post('/:id/test', authMiddleware, webhookController.testWebhook);

module.exports = router;
