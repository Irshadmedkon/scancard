const { query, queryOne, transaction } = require('../../config/database');
const { formatResponse, generateUsername } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');
const QRCode = require('qrcode');
const logger = require('../../utils/logger');

class ProfileController {
  /**
   * Get all user profiles
   * GET /api/v1/profiles
   */
  async getProfiles(req, res) {
    const userId = req.user.user_id;

    const profiles = await query(
      `SELECT profile_id, profile_name, username, bio, company, designation, 
              profile_picture, is_public,
              created_at, updated_at
       FROM profiles 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(formatResponse(true, { profiles, count: profiles.length }, 'Profiles retrieved successfully'));
  }

  /**
   * Create new profile
   * POST /api/v1/profiles
   */
  async createProfile(req, res) {
    const userId = req.user.user_id;
    const { profile_name, username, bio, company, designation, website, is_public } = req.body;

    // Generate username if not provided
    const finalUsername = username || generateUsername(profile_name);

    // Check if username exists
    const existingProfile = await queryOne(
      'SELECT profile_id FROM profiles WHERE username = ?',
      [finalUsername]
    );

    if (existingProfile) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        { code: 'USERNAME_EXISTS', message: 'Username already taken' }
      ));
    }

    const result = await query(
      `INSERT INTO profiles (user_id, profile_name, username, bio, company, designation, website, is_public, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, profile_name, finalUsername, bio || null, company || null, designation || null, website || null, is_public !== false]
    );

    const profile = await queryOne('SELECT * FROM profiles WHERE profile_id = ?', [result.insertId]);

    logger.info('Profile created', { userId, profileId: result.insertId });

    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { profile }, 'Profile created successfully'));
  }

  /**
   * Get profile by ID
   * GET /api/v1/profiles/:id
   */
  async getProfile(req, res) {
    const { id } = req.params;
    const userId = req.user?.user_id;

    const profile = await queryOne(
      `SELECT p.*, u.email, u.full_name, u.phone
       FROM profiles p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.profile_id = ? AND (p.is_public = 1 OR p.user_id = ?)`,
      [id, userId || 0]
    );

    if (!profile) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false,
        null,
        '',
        { code: 'NOT_FOUND', message: 'Profile not found' }
      ));
    }

    // Get profile links
    const links = await query(
      'SELECT * FROM profile_links WHERE profile_id = ? ORDER BY display_order',
      [id]
    );

    profile.links = links;

    // Track view if not owner
    if (!userId || userId !== profile.user_id) {
      await query(
        'INSERT INTO analytics (profile_id, event_type, created_at) VALUES (?, ?, NOW())',
        [id, 'profile_view']
      );
    }

    res.json(formatResponse(true, { profile }, 'Profile retrieved successfully'));
  }

  /**
   * Update profile
   * PUT /api/v1/profiles/:id
   */
  async updateProfile(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;
    const updates = req.body;

    // Verify ownership
    const profile = await queryOne(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!profile) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false,
        null,
        '',
        { code: 'NOT_FOUND', message: 'Profile not found' }
      ));
    }

    // Check username uniqueness if updating
    if (updates.username) {
      const existingProfile = await queryOne(
        'SELECT profile_id FROM profiles WHERE username = ? AND profile_id != ?',
        [updates.username, id]
      );

      if (existingProfile) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
          false,
          null,
          '',
          { code: 'USERNAME_EXISTS', message: 'Username already taken' }
        ));
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
      updateValues.push(id);

      await query(
        `UPDATE profiles SET ${updateFields.join(', ')} WHERE profile_id = ?`,
        updateValues
      );
    }

    const updatedProfile = await queryOne('SELECT * FROM profiles WHERE profile_id = ?', [id]);

    logger.info('Profile updated', { userId, profileId: id });

    res.json(formatResponse(true, { profile: updatedProfile }, 'Profile updated successfully'));
  }

  /**
   * Delete profile
   * DELETE /api/v1/profiles/:id
   */
  async deleteProfile(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const profile = await queryOne(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!profile) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false,
        null,
        '',
        { code: 'NOT_FOUND', message: 'Profile not found' }
      ));
    }

    await query('DELETE FROM profiles WHERE profile_id = ?', [id]);

    logger.info('Profile deleted', { userId, profileId: id });

    res.json(formatResponse(true, null, 'Profile deleted successfully'));
  }

  /**
   * Generate QR code
   * GET /api/v1/profiles/:id/qr
   */
  async generateQR(req, res) {
    const { id } = req.params;

    const profile = await queryOne(
      'SELECT username FROM profiles WHERE profile_id = ? AND is_public = 1',
      [id]
    );

    if (!profile) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false,
        null,
        '',
        { code: 'NOT_FOUND', message: 'Profile not found' }
      ));
    }

    const profileUrl = `${process.env.FRONTEND_URL}/profile/${profile.username}`;
    const qrCode = await QRCode.toDataURL(profileUrl);

    res.json(formatResponse(true, { qr_code: qrCode, url: profileUrl }, 'QR code generated'));
  }

  /**
   * Upload profile avatar
   * POST /api/v1/profiles/:id/avatar
   */
  async uploadAvatar(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    if (!req.file) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false,
        null,
        '',
        { code: 'FILE_REQUIRED', message: 'Avatar file is required' }
      ));
    }

    // Verify ownership
    const profile = await queryOne(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!profile) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false,
        null,
        '',
        { code: 'NOT_FOUND', message: 'Profile not found' }
      ));
    }

    const uploadService = require('../../services/uploadService');
    const result = await uploadService.upload(req.file, {
      userId,
      storage: 'local',
      subfolder: 'profile-pictures',
      resize: true,
      width: 400,
      height: 400
    });

    // Update profile with new avatar
    await query(
      'UPDATE profiles SET profile_picture = ?, updated_at = NOW() WHERE profile_id = ?',
      [result.data.url, id]
    );

    logger.info('Profile avatar uploaded', { userId, profileId: id });

    res.json(formatResponse(true, result.data, 'Avatar uploaded successfully'));
  }

  /**
   * Get profile by username
   * GET /api/v1/profiles/username/:username
   */
  async getProfileByUsername(req, res) {
    const { username } = req.params;

    const profile = await queryOne(
      `SELECT p.*, u.email, u.full_name
       FROM profiles p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.username = ? AND p.is_public = 1`,
      [username]
    );

    if (!profile) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false,
        null,
        '',
        { code: 'NOT_FOUND', message: 'Profile not found' }
      ));
    }

    const links = await query(
      'SELECT * FROM profile_links WHERE profile_id = ? ORDER BY display_order',
      [profile.profile_id]
    );

    profile.links = links;

    // Track view
    await query(
      'INSERT INTO analytics (profile_id, event_type, created_at) VALUES (?, ?, NOW())',
      [profile.profile_id, 'profile_view']
    );

    res.json(formatResponse(true, { profile }, 'Profile retrieved successfully'));
  }

  /**
   * Add link to profile
   * POST /api/v1/profiles/:id/links
   */
  async addLink(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;
    const { title, url, icon, display_order } = req.body;

    const profile = await queryOne(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!profile) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false,
        null,
        '',
        { code: 'NOT_FOUND', message: 'Profile not found' }
      ));
    }

    const result = await query(
      'INSERT INTO profile_links (profile_id, title, url, icon, display_order, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [id, title, url, icon || null, display_order || 0]
    );

    const link = await queryOne('SELECT * FROM profile_links WHERE link_id = ?', [result.insertId]);

    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { link }, 'Link added successfully'));
  }

  /**
   * Update profile link
   * PUT /api/v1/profiles/:id/links/:linkId
   */
  async updateLink(req, res) {
    const { id, linkId } = req.params;
    const userId = req.user.user_id;
    const updates = req.body;

    const link = await queryOne(
      `SELECT pl.* FROM profile_links pl
       JOIN profiles p ON pl.profile_id = p.profile_id
       WHERE pl.link_id = ? AND pl.profile_id = ? AND p.user_id = ?`,
      [linkId, id, userId]
    );

    if (!link) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false,
        null,
        '',
        { code: 'NOT_FOUND', message: 'Link not found' }
      ));
    }

    const allowedFields = ['title', 'url', 'icon', 'display_order'];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length > 0) {
      updateValues.push(linkId);
      await query(
        `UPDATE profile_links SET ${updateFields.join(', ')} WHERE link_id = ?`,
        updateValues
      );
    }

    const updatedLink = await queryOne('SELECT * FROM profile_links WHERE link_id = ?', [linkId]);

    res.json(formatResponse(true, { link: updatedLink }, 'Link updated successfully'));
  }

  /**
   * Delete profile link
   * DELETE /api/v1/profiles/:id/links/:linkId
   */
  async deleteLink(req, res) {
    const { id, linkId } = req.params;
    const userId = req.user.user_id;

    const link = await queryOne(
      `SELECT pl.* FROM profile_links pl
       JOIN profiles p ON pl.profile_id = p.profile_id
       WHERE pl.link_id = ? AND pl.profile_id = ? AND p.user_id = ?`,
      [linkId, id, userId]
    );

    if (!link) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false,
        null,
        '',
        { code: 'NOT_FOUND', message: 'Link not found' }
      ));
    }

    await query('DELETE FROM profile_links WHERE link_id = ?', [linkId]);

    res.json(formatResponse(true, null, 'Link deleted successfully'));
  }

  /**
   * Get profile analytics
   * GET /api/v1/profiles/:id/analytics
   */
  async getAnalytics(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const profile = await queryOne(
      'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
      [id, userId]
    );

    if (!profile) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false,
        null,
        '',
        { code: 'NOT_FOUND', message: 'Profile not found' }
      ));
    }

    const views = await queryOne(
      'SELECT COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ?',
      [id, 'profile_view']
    );

    const linkClicks = await queryOne(
      'SELECT COUNT(*) as count FROM analytics WHERE profile_id = ? AND event_type = ?',
      [id, 'link_click']
    );

    res.json(formatResponse(true, {
      profile_views: views.count,
      link_clicks: linkClicks.count
    }, 'Analytics retrieved successfully'));
  }

  /**
   * Track profile view
   * POST /api/v1/profiles/:id/view
   */
  async trackView(req, res) {
    const { id } = req.params;

    await query(
      'INSERT INTO analytics (profile_id, event_type, created_at) VALUES (?, ?, NOW())',
      [id, 'profile_view']
    );

    res.json(formatResponse(true, null, 'View tracked'));
  }
}

module.exports = new ProfileController();


