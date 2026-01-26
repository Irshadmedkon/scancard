const { query, queryOne } = require('../../config/database');
const { cacheService } = require('../../services/cacheService');
const { generateUsername } = require('../../utils/helpers');
const QRCode = require('qrcode');
const logger = require('../../utils/logger');

class ProfileService {
  /**
   * Get all user profiles with caching
   */
  async getUserProfiles(userId) {
    const cacheKey = `user:${userId}:profiles`;

    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const profiles = await query(
      `SELECT profile_id, profile_name, username, bio, company, designation, 
              profile_picture, is_public,
              created_at, updated_at
       FROM profiles 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Cache for 5 minutes
    await cacheService.set(cacheKey, profiles, 300);

    return profiles;
  }

  /**
   * Create new profile
   */
  async createProfile(userId, profileData) {
    const { profile_name, username, bio, company, designation, website, is_public } = profileData;

    // Generate username if not provided
    const finalUsername = username || generateUsername(profile_name);

    // Check if username exists
    const existingProfile = await queryOne(
      'SELECT profile_id FROM profiles WHERE username = ?',
      [finalUsername]
    );

    if (existingProfile) {
      throw new Error('Username already taken');
    }

    const result = await query(
      `INSERT INTO profiles (user_id, profile_name, username, bio, company, designation, website, is_public, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, profile_name, finalUsername, bio || null, company || null, designation || null, website || null, is_public !== false]
    );

    const profile = await queryOne('SELECT * FROM profiles WHERE profile_id = ?', [result.insertId]);

    // Clear cache
    await cacheService.del(`user:${userId}:profiles`);

    logger.info('Profile created', { userId, profileId: result.insertId });

    return profile;
  }

  /**
   * Get profile by ID with caching
   */
  async getProfileById(profileId, userId = null) {
    const cacheKey = `profile:${profileId}`;

    // Try cache
    let profile = await cacheService.get(cacheKey);

    if (!profile) {
      profile = await queryOne(
        `SELECT p.*, u.email, u.full_name, u.phone
         FROM profiles p
         JOIN users u ON p.user_id = u.user_id
         WHERE p.profile_id = ? AND (p.is_public = 1 OR p.user_id = ?)`,
        [profileId, userId || 0]
      );

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Cache for 10 minutes
      await cacheService.set(cacheKey, profile, 600);
    }

    // Get profile links
    const links = await query(
      'SELECT * FROM profile_links WHERE profile_id = ? ORDER BY display_order',
      [profileId]
    );

    profile.links = links;

    // Track view if not owner
    if (!userId || userId !== profile.user_id) {
      await this.trackProfileView(profileId);
    }

    return profile;
  }

  /**
   * Update profile
   */
  async updateProfile(profileId, userId, updates) {
    // Verify ownership
    const profile = await queryOne(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [profileId, userId]
    );

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Check username uniqueness if updating
    if (updates.username) {
      const existingProfile = await queryOne(
        'SELECT profile_id FROM profiles WHERE username = ? AND profile_id != ?',
        [updates.username, profileId]
      );

      if (existingProfile) {
        throw new Error('Username already taken');
      }
    }

    // Build update query
    const allowedFields = ['profile_name', 'username', 'bio', 'company', 'designation', 'website', 'profile_picture', 'is_public'];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateValues.push(profileId);

      await query(
        `UPDATE profiles SET ${updateFields.join(', ')} WHERE profile_id = ?`,
        updateValues
      );
    }

    // Clear caches
    await cacheService.del(`user:${userId}:profiles`);
    await cacheService.del(`profile:${profileId}`);

    const updatedProfile = await queryOne('SELECT * FROM profiles WHERE profile_id = ?', [profileId]);

    logger.info('Profile updated', { userId, profileId });

    return updatedProfile;
  }

  /**
   * Delete profile
   */
  async deleteProfile(profileId, userId) {
    const profile = await queryOne(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [profileId, userId]
    );

    if (!profile) {
      throw new Error('Profile not found');
    }

    await query('DELETE FROM profiles WHERE profile_id = ?', [profileId]);

    // Clear caches
    await cacheService.del(`user:${userId}:profiles`);
    await cacheService.del(`profile:${profileId}`);

    logger.info('Profile deleted', { userId, profileId });
  }

  /**
   * Generate QR code
   */
  async generateQRCode(profileId) {
    const profile = await queryOne(
      'SELECT username FROM profiles WHERE profile_id = ? AND is_public = 1',
      [profileId]
    );

    if (!profile) {
      throw new Error('Profile not found');
    }

    const profileUrl = `${process.env.FRONTEND_URL}/profile/${profile.username}`;
    const qrCode = await QRCode.toDataURL(profileUrl);

    return { qr_code: qrCode, url: profileUrl };
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(username) {
    const cacheKey = `profile:username:${username}`;

    let profile = await cacheService.get(cacheKey);

    if (!profile) {
      profile = await queryOne(
        `SELECT p.*, u.email, u.full_name
         FROM profiles p
         JOIN users u ON p.user_id = u.user_id
         WHERE p.username = ? AND p.is_public = 1`,
        [username]
      );

      if (!profile) {
        throw new Error('Profile not found');
      }

      await cacheService.set(cacheKey, profile, 600);
    }

    const links = await query(
      'SELECT * FROM profile_links WHERE profile_id = ? ORDER BY display_order',
      [profile.profile_id]
    );

    profile.links = links;

    // Track view
    await this.trackProfileView(profile.profile_id);

    return profile;
  }

  /**
   * Track profile view
   */
  async trackProfileView(profileId) {
    await query(
      'INSERT INTO analytics (profile_id, event_type, created_at) VALUES (?, ?, NOW())',
      [profileId, 'profile_view']
    );
  }

  /**
   * Get profile analytics
   */
  async getProfileAnalytics(profileId, userId) {
    const profile = await queryOne(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [profileId, userId]
    );

    if (!profile) {
      throw new Error('Profile not found');
    }

    const views = await queryOne(
      'SELECT COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ?',
      [profileId, 'profile_view']
    );

    const linkClicks = await queryOne(
      'SELECT COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ?',
      [profileId, 'link_click']
    );

    return {
      profile_views: views.count,
      link_clicks: linkClicks.count
    };
  }
}

module.exports = new ProfileService();


