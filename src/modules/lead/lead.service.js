const { query, queryOne } = require('../../config/database');
const { cacheService } = require('../../services/cacheService');
const logger = require('../../utils/logger');

class LeadService {
  /**
   * Get all leads for user
   */
  async getLeads(userId, filters = {}) {
    const { profile_id, status, source, page = 1, limit = 20 } = filters;

    let sql = `SELECT l.* FROM leads l 
               JOIN profiles p ON l.profile_id = p.profile_id 
               WHERE p.user_id = ?`;
    const params = [userId];

    if (profile_id) {
      sql += ' AND l.profile_id = ?';
      params.push(profile_id);
    }
    if (status) {
      sql += ' AND l.status = ?';
      params.push(status);
    }
    if (source) {
      sql += ' AND l.source = ?';
      params.push(source);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` ORDER BY l.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const leads = await query(sql, params);

    return leads;
  }

  /**
   * Create new lead
   */
  async createLead(leadData) {
    const { profile_id, name, email, phone, company, message, source } = leadData;

    const result = await query(
      `INSERT INTO leads (profile_id, name, email, phone, company, message, source, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', NOW(), NOW())`,
      [profile_id, name, email || null, phone || null, company || null, message || null, source || 'direct']
    );

    const lead = await queryOne('SELECT * FROM leads WHERE lead_id = ?', [result.insertId]);

    logger.info('Lead created', { leadId: result.insertId, profileId: profile_id });

    return lead;
  }

  /**
   * Get lead by ID
   */
  async getLeadById(leadId, userId) {
    const lead = await queryOne(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE l.lead_id = ? AND p.user_id = ?`,
      [leadId, userId]
    );

    if (!lead) {
      throw new Error('Lead not found');
    }

    return lead;
  }

  /**
   * Update lead
   */
  async updateLead(leadId, userId, updates) {
    const lead = await queryOne(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE l.lead_id = ? AND p.user_id = ?`,
      [leadId, userId]
    );

    if (!lead) {
      throw new Error('Lead not found');
    }

    const allowedFields = ['name', 'email', 'phone', 'company', 'message', 'status', 'notes'];
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
      updateValues.push(leadId);
      await query(`UPDATE leads SET ${updateFields.join(', ')} WHERE lead_id = ?`, updateValues);
    }

    const updatedLead = await queryOne('SELECT * FROM leads WHERE lead_id = ?', [leadId]);

    logger.info('Lead updated', { leadId, userId });

    return updatedLead;
  }

  /**
   * Delete lead
   */
  async deleteLead(leadId, userId) {
    const lead = await queryOne(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE l.lead_id = ? AND p.user_id = ?`,
      [leadId, userId]
    );

    if (!lead) {
      throw new Error('Lead not found');
    }

    await query('DELETE FROM leads WHERE lead_id = ?', [leadId]);

    logger.info('Lead deleted', { leadId, userId });
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(userId) {
    const stats = await queryOne(
      `SELECT 
         COUNT(*) as total_leads,
         SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
         SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_leads,
         SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_leads
       FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE p.user_id = ?`,
      [userId]
    );

    return stats;
  }
}

module.exports = new LeadService();
