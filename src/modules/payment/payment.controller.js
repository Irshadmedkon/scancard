const { query, queryOne } = require('../../config/database');
const { formatResponse, generateRandomString } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');

class PaymentController {
  async createRazorpayOrder(req, res) {
    const userId = req.user.user_id;
    const { amount, currency = 'INR' } = req.body;

    const orderReference = `ORD_${Date.now()}_${generateRandomString(8)}`;

    const result = await query(
      `INSERT INTO payment_orders (user_id, order_reference, amount, currency, status, payment_gateway, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', 'razorpay', NOW(), NOW())`,
      [userId, orderReference, amount, currency]
    );

    const order = await queryOne('SELECT * FROM payment_orders WHERE order_id = ?', [result.insertId]);

    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { order }, 'Order created'));
  }

  async verifyRazorpayPayment(req, res) {
    const userId = req.user.user_id;
    const { order_reference, payment_id, signature } = req.body;

    // TODO: Verify signature with Razorpay

    await query(
      `UPDATE payment_orders SET status = 'completed', gateway_payment_id = ?, updated_at = NOW()
       WHERE order_reference = ? AND user_id = ?`,
      [payment_id, order_reference, userId]
    );

    res.json(formatResponse(true, { verified: true }, 'Payment verified'));
  }

  async createStripeSession(req, res) {
    const userId = req.user.user_id;
    const { amount, currency = 'USD' } = req.body;

    const orderReference = `ORD_${Date.now()}_${generateRandomString(8)}`;

    const result = await query(
      `INSERT INTO payment_orders (user_id, order_reference, amount, currency, status, payment_gateway, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', 'stripe', NOW(), NOW())`,
      [userId, orderReference, amount, currency]
    );

    const order = await queryOne('SELECT * FROM payment_orders WHERE order_id = ?', [result.insertId]);

    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { order, session_url: 'https://checkout.stripe.com/...' }, 'Session created'));
  }

  async verifyStripePayment(req, res) {
    const userId = req.user.user_id;
    const { order_reference, session_id } = req.body;

    // TODO: Verify with Stripe

    await query(
      `UPDATE payment_orders SET status = 'completed', gateway_order_id = ?, updated_at = NOW()
       WHERE order_reference = ? AND user_id = ?`,
      [session_id, order_reference, userId]
    );

    res.json(formatResponse(true, { verified: true }, 'Payment verified'));
  }

  async getPaymentHistory(req, res) {
    const userId = req.user.user_id;

    const payments = await query(
      'SELECT * FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json(formatResponse(true, { payments, count: payments.length }, 'Payment history retrieved'));
  }

  async getPaymentByOrder(req, res) {
    const { orderId } = req.params;
    const userId = req.user.user_id;

    const payment = await queryOne(
      'SELECT * FROM payment_orders WHERE order_reference = ? AND user_id = ?',
      [orderId, userId]
    );

    if (!payment) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Payment not found' }
      ));
    }

    res.json(formatResponse(true, { payment }, 'Payment retrieved'));
  }

  async cancelPayment(req, res) {
    const { orderId } = req.params;
    const userId = req.user.user_id;

    await query(
      `UPDATE payment_orders SET status = 'failed', updated_at = NOW()
       WHERE order_reference = ? AND user_id = ? AND status = 'pending'`,
      [orderId, userId]
    );

    res.json(formatResponse(true, null, 'Payment cancelled'));
  }

  async getPlans(req, res) {
    const plans = [
      { plan_id: 'free', name: 'Free', price: 0, features: ['1 Profile', 'Basic Analytics'] },
      { plan_id: 'pro', name: 'Pro', price: 499, features: ['5 Profiles', 'Advanced Analytics', 'Business Features'] },
      { plan_id: 'business', name: 'Business', price: 999, features: ['Unlimited Profiles', 'All Features', 'Priority Support'] }
    ];

    res.json(formatResponse(true, { plans }, 'Plans retrieved'));
  }

  async handleWebhook(req, res) {
    // TODO: Handle payment gateway webhooks
    res.json(formatResponse(true, null, 'Webhook received'));
  }
}

module.exports = new PaymentController();
