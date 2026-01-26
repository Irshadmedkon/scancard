const { query, queryOne } = require('../../config/database');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');

class SubscriptionController {
  async getPlans(req, res) {
    const plans = [
      {
        plan_id: 'free',
        name: 'Free',
        price: 0,
        interval: 'lifetime',
        features: {
          profiles: 1,
          menu_enabled: false,
          catalog_enabled: false,
          booking_enabled: false,
          analytics: 'basic'
        }
      },
      {
        plan_id: 'pro',
        name: 'Pro',
        price: 499,
        interval: 'monthly',
        features: {
          profiles: 5,
          menu_enabled: true,
          catalog_enabled: true,
          booking_enabled: false,
          analytics: 'advanced'
        }
      },
      {
        plan_id: 'business',
        name: 'Business',
        price: 999,
        interval: 'monthly',
        features: {
          profiles: -1,
          menu_enabled: true,
          catalog_enabled: true,
          booking_enabled: true,
          analytics: 'premium'
        }
      }
    ];

    res.json(formatResponse(true, { plans }, 'Plans retrieved'));
  }

  async getCurrentSubscription(req, res) {
    const userId = req.user.user_id;

    const subscription = await queryOne(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
      [userId, 'active']
    );

    if (!subscription) {
      return res.json(formatResponse(true, {
        subscription: {
          plan_name: 'free',
          status: 'active',
          features: { profiles: 1 }
        }
      }, 'Current subscription'));
    }

    res.json(formatResponse(true, { subscription }, 'Current subscription'));
  }

  async upgradePlan(req, res) {
    const userId = req.user.user_id;
    const { plan_name, payment_order_id } = req.body;

    // Cancel existing subscription
    await query(
      `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    // Create new subscription
    const result = await query(
      `INSERT INTO subscriptions (user_id, plan_name, status, start_date, end_date, created_at, updated_at)
       VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), NOW(), NOW())`,
      [userId, plan_name]
    );

    const subscription = await queryOne('SELECT * FROM subscriptions WHERE subscription_id = ?', [result.insertId]);

    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { subscription }, 'Subscription upgraded'));
  }

  async cancelSubscription(req, res) {
    const userId = req.user.user_id;

    await query(
      `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    res.json(formatResponse(true, null, 'Subscription cancelled'));
  }

  async getUsage(req, res) {
    const userId = req.user.user_id;

    const profileCount = await queryOne(
      'SELECT COUNT(*) as count FROM profiles WHERE user_id = ?',
      [userId]
    );

    const leadCount = await queryOne(
      `SELECT COUNT(*) as count FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?`,
      [userId]
    );

    res.json(formatResponse(true, {
      usage: {
        profiles: profileCount.count,
        leads: leadCount.count
      }
    }, 'Usage statistics'));
  }

  async getHistory(req, res) {
    const userId = req.user.user_id;

    const history = await query(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json(formatResponse(true, { history, count: history.length }, 'Subscription history'));
  }

  async renewSubscription(req, res) {
    const userId = req.user.user_id;

    const current = await queryOne(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
      [userId, 'active']
    );

    if (!current) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'No active subscription' }
      ));
    }

    await query(
      `UPDATE subscriptions SET end_date = DATE_ADD(end_date, INTERVAL 1 MONTH), updated_at = NOW()
       WHERE subscription_id = ?`,
      [current.subscription_id]
    );

    res.json(formatResponse(true, null, 'Subscription renewed'));
  }

  async getFeatures(req, res) {
    const userId = req.user.user_id;

    const subscription = await queryOne(
      'SELECT plan_name FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
      [userId, 'active']
    );

    const planName = subscription ? subscription.plan_name : 'free';

    const features = {
      free: { profiles: 1, menu: false, catalog: false, booking: false },
      pro: { profiles: 5, menu: true, catalog: true, booking: false },
      business: { profiles: -1, menu: true, catalog: true, booking: true }
    };

    res.json(formatResponse(true, { features: features[planName] || features.free }, 'Features retrieved'));
  }
}

module.exports = new SubscriptionController();
