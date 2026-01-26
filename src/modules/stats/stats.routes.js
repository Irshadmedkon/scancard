const express = require('express');
const router = express.Router();
const statsController = require('./stats.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, statsController.getDashboard);
router.get('/profile/:profile_id', authMiddleware, statsController.getProfileStats);

module.exports = router;
