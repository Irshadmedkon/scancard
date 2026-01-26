const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/plans', subscriptionController.getPlans);
router.get('/current', authMiddleware, subscriptionController.getCurrentSubscription);
router.post('/upgrade', authMiddleware, subscriptionController.upgradePlan);
router.post('/cancel', authMiddleware, subscriptionController.cancelSubscription);
router.get('/usage', authMiddleware, subscriptionController.getUsage);
router.get('/history', authMiddleware, subscriptionController.getHistory);
router.post('/renew', authMiddleware, subscriptionController.renewSubscription);
router.get('/features', authMiddleware, subscriptionController.getFeatures);

module.exports = router;
