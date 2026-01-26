const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.post('/razorpay/create-order', authMiddleware, paymentController.createRazorpayOrder);
router.post('/razorpay/verify', authMiddleware, paymentController.verifyRazorpayPayment);
router.post('/stripe/create-session', authMiddleware, paymentController.createStripeSession);
router.post('/stripe/verify', authMiddleware, paymentController.verifyStripePayment);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);
router.get('/history/:orderId', authMiddleware, paymentController.getPaymentByOrder);
router.post('/cancel/:orderId', authMiddleware, paymentController.cancelPayment);
router.get('/plans', paymentController.getPlans);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
