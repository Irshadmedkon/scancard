const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, analyticsController.getDashboard);
router.get('/profiles', authMiddleware, analyticsController.getProfileAnalytics);
router.get('/leads', authMiddleware, analyticsController.getLeadAnalytics);
router.get('/traffic', authMiddleware, analyticsController.getTraffic);
router.get('/conversions', authMiddleware, analyticsController.getConversions);
router.get('/export', authMiddleware, analyticsController.exportAnalytics);

module.exports = router;
