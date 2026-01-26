const express = require('express');
const router = express.Router();
const apikeyController = require('./apikey.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, apikeyController.getApiKeys);
router.post('/', authMiddleware, apikeyController.createApiKey);
router.get('/:id', authMiddleware, apikeyController.getApiKey);
router.put('/:id', authMiddleware, apikeyController.updateApiKey);
router.delete('/:id', authMiddleware, apikeyController.deleteApiKey);
router.post('/:id/regenerate', authMiddleware, apikeyController.regenerateApiKey);

module.exports = router;
