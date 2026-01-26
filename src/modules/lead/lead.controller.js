const { query, queryOne } = require('../../config/database');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');
const logger = require('../../utils/logger');

class LeadController {
  async getLeads(req, res) {
    const userId = req.user.user_id;
    const { profile_id, status, source, page = 1, limit = 20 } = req.query;

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

    res.json(formatResponse(true, { leads, page: parseInt(page), limit: parseInt(limit) }, 'Leads retrieved'));
  }

  async createLead(req, res) {
    const { profile_id, name, email, phone, company, message, source } = req.body;

    const result = await query(
      `INSERT INTO leads (profile_id, name, email, phone, company, message, source, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', NOW(), NOW())`,
      [profile_id, name, email || null, phone || null, company || null, message || null, source || 'direct']
    );

    const lead = await queryOne('SELECT * FROM leads WHERE lead_id = ?', [result.insertId]);

    logger.info('Lead created', { leadId: result.insertId, profileId: profile_id });

    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { lead }, 'Lead captured successfully'));
  }

  async getLead(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const lead = await queryOne(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE l.lead_id = ? AND p.user_id = ?`,
      [id, userId]
    );

    if (!lead) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Lead not found' }
      ));
    }

    res.json(formatResponse(true, { lead }, 'Lead retrieved'));
  }

  async updateLead(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;
    const updates = req.body;

    const lead = await queryOne(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE l.lead_id = ? AND p.user_id = ?`,
      [id, userId]
    );

    if (!lead) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Lead not found' }
      ));
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
      updateValues.push(id);
      await query(`UPDATE leads SET ${updateFields.join(', ')} WHERE lead_id = ?`, updateValues);
    }

    const updatedLead = await queryOne('SELECT * FROM leads WHERE lead_id = ?', [id]);

    res.json(formatResponse(true, { lead: updatedLead }, 'Lead updated'));
  }

  async updateLeadStatus(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;
    const { status } = req.body;

    if (!status) {
      return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
        false, null, '', { code: 'VALIDATION_ERROR', message: 'Status is required' }
      ));
    }

    const lead = await queryOne(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE l.lead_id = ? AND p.user_id = ?`,
      [id, userId]
    );

    if (!lead) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Lead not found' }
      ));
    }

    await query('UPDATE leads SET status = ?, updated_at = NOW() WHERE lead_id = ?', [status, id]);

    const updatedLead = await queryOne('SELECT * FROM leads WHERE lead_id = ?', [id]);

    logger.info('Lead status updated', { leadId: id, userId, status });

    res.json(formatResponse(true, { lead: updatedLead }, 'Lead status updated'));
  }

  async archiveLead(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const lead = await queryOne(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE l.lead_id = ? AND p.user_id = ?`,
      [id, userId]
    );

    if (!lead) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Lead not found' }
      ));
    }

    await query('UPDATE leads SET is_archived = 1, updated_at = NOW() WHERE lead_id = ?', [id]);

    const updatedLead = await queryOne('SELECT * FROM leads WHERE lead_id = ?', [id]);

    logger.info('Lead archived', { leadId: id, userId });

    res.json(formatResponse(true, { lead: updatedLead }, 'Lead archived successfully'));
  }

  async deleteLead(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const lead = await queryOne(
      `SELECT l.* FROM leads l
       JOIN profiles p ON l.profile_id = p.profile_id
       WHERE l.lead_id = ? AND p.user_id = ?`,
      [id, userId]
    );

    if (!lead) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Lead not found' }
      ));
    }

    await query('DELETE FROM leads WHERE lead_id = ?', [id]);

    res.json(formatResponse(true, null, 'Lead deleted'));
  }

  async exportCSV(req, res) {
    const userId = req.user.user_id;
    const { profile_id, status, start_date, end_date } = req.query;

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
    if (start_date) {
      sql += ' AND DATE(l.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(l.created_at) <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY l.created_at DESC';

    logger.info('CSV Export Query', { userId, profile_id, status, start_date, end_date, sql, params });

    const leads = await query(sql, params);

    logger.info('CSV Export Results', { userId, leadCount: leads.length });

    // Create CSV with proper escaping
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Format date to readable string
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().replace('T', ' ').substring(0, 19);
    };

    const csv = [
      ['ID', 'Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Created At'].join(','),
      ...leads.map(lead => [
        lead.lead_id,
        escapeCsvValue(lead.name),
        escapeCsvValue(lead.email),
        escapeCsvValue(lead.phone),
        escapeCsvValue(lead.company),
        lead.status,
        escapeCsvValue(lead.source),
        formatDate(lead.created_at)
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads-${Date.now()}.csv`);
    res.send(csv);
  }
}

module.exports = new LeadController();
