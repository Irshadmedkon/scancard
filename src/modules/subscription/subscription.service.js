const { query, queryOne } = require('../../config/database');
const logger = require('../../utils/logger');

class SubscriptionService {
  /**
   * Get all subscription plans
   */
  getPlans() {
    return [
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
          analytics: 'basic',
          api_access: false
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
          analytics: 'advanced',
          api_access: false
        }
      },
      {
        plan_id: 'business',
        name: 'Business',
        price: 999,
        interval: 'monthly',
        features: {
          profiles: -1, // unlimited
          menu_enabled: true,
          catalog_enabled: true,
          booking_enabled: true,
          analytics: 'premium',
          api_access: true
        }
      }
    ];
  }

  /**
   * Get current subscription
   */
  async getCurrentSubscription(userId) {
    const subscription = await queryOne(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
      [userId, 'active']
    );

    if (!subscription) {
      // Return free plan
      return {
        plan_name: 'free',
        status: 'active',
        features: this.getPlans()[0].features
      };
    }

    // Get plan features
    const plan = this.getPlans().find(p => p.plan_id === subscription.plan_name);

    return {
      ...subscription,
      features: plan ? plan.features : {}
    };
  }

  /**
   * Upgrade/Change subscription
   */
  async upgradeSubscription(userId, subscriptionData) {
    const { plan_name, payment_order_id } = subscriptionData;

    // Validate plan
    const plan = this.getPlans().find(p => p.plan_id === plan_name);
    if (!plan) {
      throw new Error('Invalid plan');
    }

    // Cancel existing active subscription
    await query(
      `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    // Create new subscription
    const endDate = plan.interval === 'monthly' 
      ? 'DATE_ADD(NOW(), INTERVAL 1 MONTH)'
      : 'NULL';

    const result = await query(
      `INSERT INTO subscriptions (user_id, plan_name, status, start_date, end_date, created_at, updated_at)
       VALUES (?, ?, 'active', NOW(), ${endDate}, NOW(), NOW())`,
      [userId, plan_name]
    );

    const subscription = await queryOne('SELECT * FROM subscriptions WHERE subscription_id = ?', [result.insertId]);

    logger.info('Subscription upgraded', { userId, planName: plan_name });

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId) {
    const subscription = await queryOne(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
      [userId, 'active']
    );

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    await query(
      `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
       WHERE subscription_id = ?`,
      [subscription.subscription_id]
    );

    logger.info('Subscription cancelled', { userId });
  }

  /**
   * Get usage statistics
   */
  async getUsage(userId) {
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

    const menuItemCount = await queryOne(
      `SELECT COUNT(*) as count FROM menu_items mi
       JOIN profiles p ON mi.profile_id = p.profile_id
       WHERE p.user_id = ?`,
      [userId]
    );

    const productCount = await queryOne(
      `SELECT COUNT(*) as count FROM product_catalog pc
       JOIN profiles p ON pc.profile_id = p.profile_id
       WHERE p.user_id = ?`,
      [userId]
    );

    return {
      profiles: profileCount.count,
      leads: leadCount.count,
      menu_items: menuItemCount.count,
      products: productCount.count
    };
  }

  /**
   * Get subscription history
   */
  async getHistory(userId) {
    const history = await query(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return history;
  }

  /**
   * Renew subscription
   */
  async renewSubscription(userId) {
    const current = await queryOne(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
      [userId, 'active']
    );

    if (!current) {
      throw new Error('No active subscription to renew');
    }

    await query(
      `UPDATE subscriptions SET end_date = DATE_ADD(end_date, INTERVAL 1 MONTH), updated_at = NOW()
       WHERE subscription_id = ?`,
      [current.subscription_id]
    );

    logger.info('Subscription renewed', { userId });

    return await queryOne('SELECT * FROM subscriptions WHERE subscription_id = ?', [current.subscription_id]);
  }

  /**
   * Get available features for user
   */
  async getFeatures(userId) {
    const subscription = await this.getCurrentSubscription(userId);
    return subscription.features || this.getPlans()[0].features;
  }

  /**
   * Check if user has feature access
   */
  async hasFeatureAccess(userId, featureName) {
    const features = await this.getFeatures(userId);
    return features[featureName] === true;
  }
}

module.exports = new SubscriptionService();
