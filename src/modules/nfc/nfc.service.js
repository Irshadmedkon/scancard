const { query, queryOne } = require('../../config/database');
const { cacheService } = require('../../services/cacheService');
const logger = require('../../utils/logger');

class NfcService {
  /**
   * Get all NFC cards for user
   */
  async getCards(userId) {
    const cards = await query(
      `SELECT n.*, p.profile_name 
       FROM nfc_cards n
       LEFT JOIN profiles p ON n.profile_id = p.profile_id
       WHERE n.user_id = ? 
       ORDER BY n.created_at DESC`,
      [userId]
    );

    return cards;
  }

  /**
   * Create new NFC card
   */
  async createCard(userId, cardData) {
    const { card_uid, card_name, profile_id } = cardData;

    // Check if card UID already exists
    const existing = await queryOne(
      'SELECT card_id FROM nfc_cards WHERE card_uid = ?',
      [card_uid]
    );

    if (existing) {
      throw new Error('Card UID already registered');
    }

    // Verify profile belongs to user if profile_id provided
    if (profile_id) {
      const profile = await queryOne(
        'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
        [profile_id, userId]
      );

      if (!profile) {
        throw new Error('Profile not found');
      }
    }

    const result = await query(
      `INSERT INTO nfc_cards (user_id, card_uid, card_name, profile_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())`,
      [userId, card_uid, card_name || null, profile_id || null]
    );

    const card = await queryOne('SELECT * FROM nfc_cards WHERE card_id = ?', [result.insertId]);

    logger.info('NFC card created', { userId, cardId: result.insertId });

    return card;
  }

  /**
   * Get card by ID
   */
  async getCardById(cardId, userId) {
    const card = await queryOne(
      `SELECT n.*, p.profile_name 
       FROM nfc_cards n
       LEFT JOIN profiles p ON n.profile_id = p.profile_id
       WHERE n.card_id = ? AND n.user_id = ?`,
      [cardId, userId]
    );

    if (!card) {
      throw new Error('Card not found');
    }

    return card;
  }

  /**
   * Update NFC card
   */
  async updateCard(cardId, userId, updates) {
    const card = await queryOne(
      'SELECT card_id FROM nfc_cards WHERE card_id = ? AND user_id = ?',
      [cardId, userId]
    );

    if (!card) {
      throw new Error('Card not found');
    }

    const { card_name, profile_id, is_active } = updates;

    // Verify profile if updating
    if (profile_id) {
      const profile = await queryOne(
        'SELECT profile_id FROM profiles WHERE profile_id = ? AND user_id = ?',
        [profile_id, userId]
      );

      if (!profile) {
        throw new Error('Profile not found');
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (card_name !== undefined) {
      updateFields.push('card_name = ?');
      updateValues.push(card_name);
    }
    if (profile_id !== undefined) {
      updateFields.push('profile_id = ?');
      updateValues.push(profile_id);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateValues.push(cardId);
      await query(`UPDATE nfc_cards SET ${updateFields.join(', ')} WHERE card_id = ?`, updateValues);
    }

    const updatedCard = await queryOne('SELECT * FROM nfc_cards WHERE card_id = ?', [cardId]);

    logger.info('NFC card updated', { userId, cardId });

    return updatedCard;
  }

  /**
   * Delete NFC card
   */
  async deleteCard(cardId, userId) {
    const card = await queryOne(
      'SELECT card_id FROM nfc_cards WHERE card_id = ? AND user_id = ?',
      [cardId, userId]
    );

    if (!card) {
      throw new Error('Card not found');
    }

    await query('DELETE FROM nfc_cards WHERE card_id = ?', [cardId]);

    logger.info('NFC card deleted', { userId, cardId });
  }

  /**
   * Activate NFC card
   */
  async activateCard(cardId, userId) {
    const card = await queryOne(
      'SELECT card_id FROM nfc_cards WHERE card_id = ? AND user_id = ?',
      [cardId, userId]
    );

    if (!card) {
      throw new Error('Card not found');
    }

    await query(
      'UPDATE nfc_cards SET is_active = TRUE, activation_date = NOW(), updated_at = NOW() WHERE card_id = ?',
      [cardId]
    );

    logger.info('NFC card activated', { userId, cardId });
  }

  /**
   * Deactivate NFC card
   */
  async deactivateCard(cardId, userId) {
    const card = await queryOne(
      'SELECT card_id FROM nfc_cards WHERE card_id = ? AND user_id = ?',
      [cardId, userId]
    );

    if (!card) {
      throw new Error('Card not found');
    }

    await query(
      'UPDATE nfc_cards SET is_active = FALSE, updated_at = NOW() WHERE card_id = ?',
      [cardId]
    );

    logger.info('NFC card deactivated', { userId, cardId });
  }

  /**
   * Track NFC scan
   */
  async trackScan(cardUid) {
    const card = await queryOne(
      'SELECT * FROM nfc_cards WHERE card_uid = ? AND is_active = TRUE',
      [cardUid]
    );

    if (!card) {
      throw new Error('Card not found or inactive');
    }

    // Update scan count and last scanned
    await query(
      'UPDATE nfc_cards SET scan_count = scan_count + 1, last_scanned = NOW() WHERE card_id = ?',
      [card.card_id]
    );

    // Track analytics if linked to profile
    if (card.profile_id) {
      await query(
        'INSERT INTO analytics (profile_id, event_type, created_at) VALUES (?, ?, NOW())',
        [card.profile_id, 'nfc_tap']
      );
    }

    return card;
  }
}

module.exports = new NfcService();
