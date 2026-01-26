const EventEmitter = require('events');
const logger = require('../utils/logger');
const jobQueue = require('../services/jobQueue');

/**
 * Observer Pattern - Event Emitter
 * Allows components to subscribe to and emit events
 */

class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  /**
   * Setup default event listeners
   */
  setupListeners() {
    // User events
    this.on('user.registered', this.onUserRegistered.bind(this));
    this.on('user.login', this.onUserLogin.bind(this));
    this.on('user.password_reset', this.onPasswordReset.bind(this));

    // Profile events
    this.on('profile.created', this.onProfileCreated.bind(this));
    this.on('profile.updated', this.onProfileUpdated.bind(this));
    this.on('profile.viewed', this.onProfileViewed.bind(this));

    // Lead events
    this.on('lead.created', this.onLeadCreated.bind(this));
    this.on('lead.updated', this.onLeadUpdated.bind(this));

    // Booking events
    this.on('booking.created', this.onBookingCreated.bind(this));
    this.on('booking.confirmed', this.onBookingConfirmed.bind(this));
    this.on('booking.cancelled', this.onBookingCancelled.bind(this));

    // Payment events
    this.on('payment.success', this.onPaymentSuccess.bind(this));
    this.on('payment.failed', this.onPaymentFailed.bind(this));

    // Subscription events
    this.on('subscription.upgraded', this.onSubscriptionUpgraded.bind(this));
    this.on('subscription.cancelled', this.onSubscriptionCancelled.bind(this));

    logger.info('Event listeners initialized');
  }

  /**
   * User registered event handler
   */
  async onUserRegistered(data) {
    try {
      logger.info('User registered event', { userId: data.user_id });

      // Send welcome email
      await jobQueue.add('send_welcome_email', {
        email: data.email,
        name: data.full_name
      });

      // Track analytics
      this.emit('analytics.track', {
        event: 'user_registered',
        user_id: data.user_id,
        properties: { email: data.email }
      });
    } catch (error) {
      logger.error('Error handling user.registered event:', error);
    }
  }

  /**
   * User login event handler
   */
  async onUserLogin(data) {
    try {
      logger.info('User login event', { userId: data.user_id });

      // Track analytics
      this.emit('analytics.track', {
        event: 'user_login',
        user_id: data.user_id,
        properties: { ip: data.ip }
      });
    } catch (error) {
      logger.error('Error handling user.login event:', error);
    }
  }

  /**
   * Password reset event handler
   */
  async onPasswordReset(data) {
    try {
      logger.info('Password reset event', { userId: data.user_id });

      // Send password reset email
      await jobQueue.add('send_email', {
        to: data.email,
        subject: 'Password Reset Successful',
        html: `<p>Your password has been reset successfully.</p>`
      });
    } catch (error) {
      logger.error('Error handling user.password_reset event:', error);
    }
  }

  /**
   * Profile created event handler
   */
  async onProfileCreated(data) {
    try {
      logger.info('Profile created event', { profileId: data.profile_id });

      // Generate QR code
      this.emit('qr.generate', {
        profile_id: data.profile_id,
        username: data.username
      });

      // Track analytics
      this.emit('analytics.track', {
        event: 'profile_created',
        user_id: data.user_id,
        properties: { profile_id: data.profile_id }
      });
    } catch (error) {
      logger.error('Error handling profile.created event:', error);
    }
  }

  /**
   * Profile updated event handler
   */
  async onProfileUpdated(data) {
    try {
      logger.info('Profile updated event', { profileId: data.profile_id });

      // Clear cache
      this.emit('cache.clear', {
        pattern: `profile:${data.profile_id}:*`
      });
    } catch (error) {
      logger.error('Error handling profile.updated event:', error);
    }
  }

  /**
   * Profile viewed event handler
   */
  async onProfileViewed(data) {
    try {
      // Track analytics (async, don't wait)
      this.emit('analytics.track', {
        event: 'profile_view',
        profile_id: data.profile_id,
        properties: {
          viewer_ip: data.ip,
          referrer: data.referrer
        }
      });
    } catch (error) {
      logger.error('Error handling profile.viewed event:', error);
    }
  }

  /**
   * Lead created event handler
   */
  async onLeadCreated(data) {
    try {
      logger.info('Lead created event', { leadId: data.lead_id });

      // Send notification to profile owner
      await jobQueue.add('send_lead_notification', {
        profile_id: data.profile_id,
        lead_name: data.name,
        lead_email: data.email
      });

      // Trigger webhook
      this.emit('webhook.trigger', {
        event: 'lead.created',
        data: data
      });

      // Track analytics
      this.emit('analytics.track', {
        event: 'lead_created',
        profile_id: data.profile_id,
        properties: { source: data.source }
      });
    } catch (error) {
      logger.error('Error handling lead.created event:', error);
    }
  }

  /**
   * Lead updated event handler
   */
  async onLeadUpdated(data) {
    try {
      logger.info('Lead updated event', { leadId: data.lead_id });

      // Trigger webhook
      this.emit('webhook.trigger', {
        event: 'lead.updated',
        data: data
      });
    } catch (error) {
      logger.error('Error handling lead.updated event:', error);
    }
  }

  /**
   * Booking created event handler
   */
  async onBookingCreated(data) {
    try {
      logger.info('Booking created event', { bookingId: data.booking_id });

      // Send confirmation email
      await jobQueue.add('send_email', {
        to: data.customer_email,
        subject: 'Booking Confirmation',
        html: `<p>Your booking has been created successfully.</p>
               <p>Date: ${data.booking_date}</p>
               <p>Time: ${data.booking_time}</p>`
      });

      // Trigger webhook
      this.emit('webhook.trigger', {
        event: 'booking.created',
        data: data
      });
    } catch (error) {
      logger.error('Error handling booking.created event:', error);
    }
  }

  /**
   * Booking confirmed event handler
   */
  async onBookingConfirmed(data) {
    try {
      logger.info('Booking confirmed event', { bookingId: data.booking_id });

      // Send confirmation email
      await jobQueue.add('send_email', {
        to: data.customer_email,
        subject: 'Booking Confirmed',
        html: `<p>Your booking has been confirmed!</p>`
      });
    } catch (error) {
      logger.error('Error handling booking.confirmed event:', error);
    }
  }

  /**
   * Booking cancelled event handler
   */
  async onBookingCancelled(data) {
    try {
      logger.info('Booking cancelled event', { bookingId: data.booking_id });

      // Send cancellation email
      await jobQueue.add('send_email', {
        to: data.customer_email,
        subject: 'Booking Cancelled',
        html: `<p>Your booking has been cancelled.</p>`
      });
    } catch (error) {
      logger.error('Error handling booking.cancelled event:', error);
    }
  }

  /**
   * Payment success event handler
   */
  async onPaymentSuccess(data) {
    try {
      logger.info('Payment success event', { orderId: data.order_id });

      // Send receipt email
      await jobQueue.add('send_email', {
        to: data.email,
        subject: 'Payment Receipt',
        html: `<p>Payment successful!</p>
               <p>Amount: ${data.amount} ${data.currency}</p>
               <p>Order ID: ${data.order_id}</p>`
      });

      // Trigger webhook
      this.emit('webhook.trigger', {
        event: 'payment.success',
        data: data
      });
    } catch (error) {
      logger.error('Error handling payment.success event:', error);
    }
  }

  /**
   * Payment failed event handler
   */
  async onPaymentFailed(data) {
    try {
      logger.info('Payment failed event', { orderId: data.order_id });

      // Send failure notification
      await jobQueue.add('send_email', {
        to: data.email,
        subject: 'Payment Failed',
        html: `<p>Your payment failed. Please try again.</p>`
      });
    } catch (error) {
      logger.error('Error handling payment.failed event:', error);
    }
  }

  /**
   * Subscription upgraded event handler
   */
  async onSubscriptionUpgraded(data) {
    try {
      logger.info('Subscription upgraded event', { userId: data.user_id });

      // Send upgrade confirmation
      await jobQueue.add('send_email', {
        to: data.email,
        subject: 'Subscription Upgraded',
        html: `<p>Your subscription has been upgraded to ${data.plan_name}!</p>`
      });
    } catch (error) {
      logger.error('Error handling subscription.upgraded event:', error);
    }
  }

  /**
   * Subscription cancelled event handler
   */
  async onSubscriptionCancelled(data) {
    try {
      logger.info('Subscription cancelled event', { userId: data.user_id });

      // Send cancellation confirmation
      await jobQueue.add('send_email', {
        to: data.email,
        subject: 'Subscription Cancelled',
        html: `<p>Your subscription has been cancelled.</p>`
      });
    } catch (error) {
      logger.error('Error handling subscription.cancelled event:', error);
    }
  }
}

// Export singleton instance
module.exports = new AppEventEmitter();
