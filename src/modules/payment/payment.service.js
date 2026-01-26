const { query, queryOne } = require('../../config/database');
const { generateRandomString } = require('../../utils/helpers');
const logger = require('../../utils/logger');

class PaymentService {
  /**
   * Create payment order
   */
  async createOrder(userId, orderData) {
    const { amount, currency = 'INR', payment_gateway = 'razorpay' } = orderData;

    const orderReference = `ORD_${Date.now()}_${generateRandomString(8)}`;

    const result = await query(
      `INSERT INTO payment_orders (user_id, order_reference, amount, currency, status, payment_gateway, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, NOW(), NOW())`,
      [userId, orderReference, amount, currency, payment_gateway]
    );

    const order = await queryOne('SELECT * FROM payment_orders WHERE order_id = ?', [result.insertId]);

    logger.info('Payment order created', { userId, orderId: result.insertId, amount });

    return order;
  }

  /**
   * Verify payment
   */
  async verifyPayment(userId, paymentData) {
    const { order_reference, payment_id, signature } = paymentData;

    // Get order
    const order = await queryOne(
      'SELECT * FROM payment_orders WHERE order_reference = ? AND user_id = ?',
      [order_reference, userId]
    );

    if (!order) {
      throw new Error('Order not found');
    }

    // TODO: Verify signature with payment gateway

    // Update order status
    await query(
      `UPDATE payment_orders SET status = 'completed', gateway_payment_id = ?, updated_at = NOW()
       WHERE order_reference = ?`,
      [payment_id, order_reference]
    );

    logger.info('Payment verified', { userId, orderReference: order_reference });

    return await queryOne('SELECT * FROM payment_orders WHERE order_reference = ?', [order_reference]);
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId) {
    const payments = await query(
      'SELECT * FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return payments;
  }

  /**
   * Get payment by order reference
   */
  async getPaymentByOrder(orderReference, userId) {
    const payment = await queryOne(
      'SELECT * FROM payment_orders WHERE order_reference = ? AND user_id = ?',
      [orderReference, userId]
    );

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  /**
   * Cancel payment
   */
  async cancelPayment(orderReference, userId) {
    const order = await queryOne(
      'SELECT * FROM payment_orders WHERE order_reference = ? AND user_id = ?',
      [orderReference, userId]
    );

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Only pending orders can be cancelled');
    }

    await query(
      `UPDATE payment_orders SET status = 'failed', updated_at = NOW()
       WHERE order_reference = ?`,
      [orderReference]
    );

    logger.info('Payment cancelled', { userId, orderReference });
  }

  /**
   * Get payment plans
   */
  getPlans() {
    return [
      {
        plan_id: 'free',
        name: 'Free',
        price: 0,
        currency: 'INR',
        interval: 'lifetime',
        features: ['1 Profile', 'Basic Analytics', 'QR Code']
      },
      {
        plan_id: 'pro',
        name: 'Pro',
        price: 499,
        currency: 'INR',
        interval: 'monthly',
        features: ['5 Profiles', 'Advanced Analytics', 'Business Features', 'Priority Support']
      },
      {
        plan_id: 'business',
        name: 'Business',
        price: 999,
        currency: 'INR',
        interval: 'monthly',
        features: ['Unlimited Profiles', 'All Features', 'API Access', '24/7 Support']
      }
    ];
  }

  /**
   * Process refund
   */
  async processRefund(orderReference, userId) {
    const order = await queryOne(
      'SELECT * FROM payment_orders WHERE order_reference = ? AND user_id = ?',
      [orderReference, userId]
    );

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'completed') {
      throw new Error('Only completed orders can be refunded');
    }

    // TODO: Process refund with payment gateway

    await query(
      `UPDATE payment_orders SET status = 'refunded', updated_at = NOW()
       WHERE order_reference = ?`,
      [orderReference]
    );

    logger.info('Payment refunded', { userId, orderReference });
  }
}

module.exports = new PaymentService();
