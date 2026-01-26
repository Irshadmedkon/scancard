const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // Create transporter (with fallback for missing config)
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        } : undefined
      });
    } catch (error) {
      logger.warn('Email transporter not configured - emails will be logged only');
      this.transporter = null;
    }
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      // If transporter not configured, just log
      if (!this.transporter) {
        logger.info('Email would be sent (transporter not configured)', { to, subject });
        return { success: true, messageId: 'simulated' };
      }

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'TapOnn'} <${process.env.EMAIL_FROM || 'noreply@taponn.me'}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', { to, subject, messageId: info.messageId });
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to TapOnn!';
    const html = `
      <h1>Welcome to TapOnn, ${name}!</h1>
      <p>Thank you for joining us. Start creating your digital business card today.</p>
      <p>Best regards,<br>TapOnn Team</p>
    `;

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Send lead notification email
   */
  async sendLeadNotification(email, leadData) {
    const subject = 'New Lead Captured!';
    const html = `
      <h1>New Lead Captured</h1>
      <p><strong>Name:</strong> ${leadData.name}</p>
      <p><strong>Email:</strong> ${leadData.email || 'N/A'}</p>
      <p><strong>Phone:</strong> ${leadData.phone || 'N/A'}</p>
      <p><strong>Company:</strong> ${leadData.company || 'N/A'}</p>
      <p><strong>Message:</strong> ${leadData.message || 'N/A'}</p>
    `;

    return await this.sendEmail(email, subject, html);
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(email, bookingData) {
    const subject = 'Booking Confirmation';
    const html = `
      <h1>Booking Confirmed</h1>
      <p>Your booking has been confirmed!</p>
      <p><strong>Service:</strong> ${bookingData.service_name}</p>
      <p><strong>Date:</strong> ${bookingData.booking_date}</p>
      <p><strong>Time:</strong> ${bookingData.booking_time}</p>
      <p><strong>Confirmation Code:</strong> ${bookingData.confirmation_code}</p>
    `;

    return await this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
