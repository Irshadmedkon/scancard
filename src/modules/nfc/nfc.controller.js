const { query, queryOne } = require('../../config/database');
const { formatResponse, generateRandomString } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');

class NfcController {
  async getCards(req, res) {
    const userId = req.user.user_id;
    const cards = await query(
      `SELECT n.*, p.profile_name FROM nfc_cards n
       LEFT JOIN profiles p ON n.profile_id = p.profile_id
       WHERE n.user_id = ? ORDER BY n.created_at DESC`,
      [userId]
    );
    res.json(formatResponse(true, { cards, count: cards.length }, 'NFC cards retrieved'));
  }

  async createCard(req, res) {
    const userId = req.user.user_id;
    const { card_uid, card_name, profile_id } = req.body;

    const existing = await queryOne('SELECT card_id FROM nfc_cards WHERE card_uid = ?', [card_uid]);
    if (existing) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false, null, '', { code: 'CARD_EXISTS', message: 'Card UID already registered' }
      ));
    }

    const result = await query(
      `INSERT INTO nfc_cards (user_id, card_uid, card_name, profile_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())`,
      [userId, card_uid, card_name || null, profile_id || null]
    );

    const card = await queryOne('SELECT * FROM nfc_cards WHERE card_id = ?', [result.insertId]);
    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { card }, 'NFC card registered'));
  }

  async getCard(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const card = await queryOne(
      `SELECT n.*, p.profile_name FROM nfc_cards n
       LEFT JOIN profiles p ON n.profile_id = p.profile_id
       WHERE n.card_id = ? AND n.user_id = ?`,
      [id, userId]
    );

    if (!card) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Card not found' }
      ));
    }

    res.json(formatResponse(true, { card }, 'Card retrieved'));
  }

  async updateCard(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;
    const { card_name, profile_id, is_active } = req.body;

    const card = await queryOne('SELECT card_id FROM nfc_cards WHERE card_id = ? AND user_id = ?', [id, userId]);
    if (!card) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Card not found' }
      ));
    }

    const updates = [];
    const values = [];

    if (card_name !== undefined) { updates.push('card_name = ?'); values.push(card_name); }
    if (profile_id !== undefined) { updates.push('profile_id = ?'); values.push(profile_id); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(id);
      await query(`UPDATE nfc_cards SET ${updates.join(', ')} WHERE card_id = ?`, values);
    }

    const updatedCard = await queryOne('SELECT * FROM nfc_cards WHERE card_id = ?', [id]);
    res.json(formatResponse(true, { card: updatedCard }, 'Card updated'));
  }

  async deleteCard(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const card = await queryOne('SELECT card_id FROM nfc_cards WHERE card_id = ? AND user_id = ?', [id, userId]);
    if (!card) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Card not found' }
      ));
    }

    await query('DELETE FROM nfc_cards WHERE card_id = ?', [id]);
    res.json(formatResponse(true, null, 'Card deleted'));
  }

  async activateCard(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    await query(
      'UPDATE nfc_cards SET is_active = TRUE, activation_date = NOW(), updated_at = NOW() WHERE card_id = ? AND user_id = ?',
      [id, userId]
    );

    res.json(formatResponse(true, null, 'Card activated'));
  }

  async deactivateCard(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    await query(
      'UPDATE nfc_cards SET is_active = FALSE, updated_at = NOW() WHERE card_id = ? AND user_id = ?',
      [id, userId]
    );

    res.json(formatResponse(true, null, 'Card deactivated'));
  }
}

module.exports = new NfcController();
