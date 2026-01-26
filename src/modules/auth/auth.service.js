const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../../config/database');
const { cacheService } = require('../../services/cacheService');
const logger = require('../../utils/logger');

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    const { email, password, full_name, phone } = userData;

    // Check if user exists
    const existingUser = await queryOne('SELECT user_id FROM users WHERE email = ?', [email]);
    
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password, full_name, phone, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [email, hashedPassword, full_name, phone || null]
    );

    const userId = result.insertId;

    // Generate tokens
    const tokens = this.generateTokens(userId, email);

    // Store refresh token
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [userId, tokens.refresh_token]
    );

    logger.info('User registered successfully', { userId, email });

    return {
      user: { user_id: userId, email, full_name, phone },
      ...tokens
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user
    const user = await queryOne(
      'SELECT user_id, email, password, full_name, phone, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      throw new Error('Account is disabled');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.user_id, user.email);

    // Store refresh token
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [user.user_id, tokens.refresh_token]
    );

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    logger.info('User logged in successfully', { userId: user.user_id, email });

    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone
      },
      ...tokens
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if token exists in database
      const tokenRecord = await queryOne(
        'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > NOW()',
        [refreshToken, decoded.user_id]
      );

      if (!tokenRecord) {
        throw new Error('Invalid or expired refresh token');
      }

      // Get user
      const user = await queryOne('SELECT user_id, email FROM users WHERE user_id = ?', [decoded.user_id]);

      // Generate new access token
      const accessToken = jwt.sign(
        { user_id: user.user_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 86400
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await query(
        'UPDATE refresh_tokens SET is_revoked = 1 WHERE token = ?',
        [refreshToken]
      );
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    const user = await queryOne('SELECT user_id, email FROM users WHERE email = ?', [email]);

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If email exists, password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { user_id: user.user_id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token
    const insertResult = await query(
      'INSERT INTO password_resets (user_id, token, expires_at, is_used) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 0)',
      [user.user_id, resetToken]
    );

    // Debug: Check what was actually inserted
    const checkRecord = await queryOne(
      'SELECT * FROM password_resets WHERE reset_id = ?',
      [insertResult.insertId]
    );
    logger.info('Password reset token created', { 
      userId: user.user_id, 
      email,
      resetId: insertResult.insertId,
      isUsed: checkRecord.is_used
    });

    return { reset_token: resetToken };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type !== 'reset') {
        throw new Error('Invalid token type');
      }

      // Check if token exists and not used
      const resetRecord = await queryOne(
        'SELECT * FROM password_resets WHERE token = ? AND user_id = ? AND expires_at > NOW() AND is_used = 0',
        [token, decoded.user_id]
      );

      logger.info('Reset token lookup', { 
        userId: decoded.user_id,
        found: !!resetRecord,
        resetRecord: resetRecord ? { reset_id: resetRecord.reset_id, is_used: resetRecord.is_used } : null
      });

      if (!resetRecord) {
        // Debug: Check what's actually in the database
        const allRecords = await query(
          'SELECT reset_id, is_used, expires_at > NOW() as is_valid FROM password_resets WHERE user_id = ? ORDER BY reset_id DESC LIMIT 3',
          [decoded.user_id]
        );
        logger.error('Reset token not found', { userId: decoded.user_id, allRecords });
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await query('UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?', [hashedPassword, decoded.user_id]);

      // Mark token as used
      await query('UPDATE password_resets SET is_used = 1 WHERE token = ?', [token]);

      // Revoke all refresh tokens
      await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?', [decoded.user_id]);

      logger.info('Password reset successful', { userId: decoded.user_id });

      return { message: 'Password reset successful' };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(userId, email) {
    const accessToken = jwt.sign(
      { user_id: userId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { user_id: userId, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 86400
    };
  }
}

module.exports = new AuthService();
