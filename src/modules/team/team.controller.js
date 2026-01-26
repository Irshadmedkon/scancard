const { query, queryOne } = require('../../config/database');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');

class TeamController {
  async getTeams(req, res) {
    const userId = req.user.user_id;
    const teams = await query(
      `SELECT t.*, COUNT(tm.member_id) as member_count
       FROM teams t
       LEFT JOIN team_members tm ON t.team_id = tm.team_id
       WHERE t.user_id = ?
       GROUP BY t.team_id
       ORDER BY t.created_at DESC`,
      [userId]
    );
    res.json(formatResponse(true, { teams, count: teams.length }, 'Teams retrieved'));
  }

  async createTeam(req, res) {
    const userId = req.user.user_id;
    const { team_name, description } = req.body;

    const result = await query(
      'INSERT INTO teams (user_id, team_name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [userId, team_name, description || null]
    );

    // Add creator as owner
    await query(
      'INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
      [result.insertId, userId, 'owner']
    );

    const team = await queryOne('SELECT * FROM teams WHERE team_id = ?', [result.insertId]);
    res.status(STATUS_CODES.CREATED).json(formatResponse(true, { team }, 'Team created'));
  }

  async getTeam(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const team = await queryOne(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.team_id = tm.team_id
       WHERE t.team_id = ? AND tm.user_id = ?`,
      [id, userId]
    );

    if (!team) {
      return res.status(STATUS_CODES.NOT_FOUND).json(formatResponse(
        false, null, '', { code: 'NOT_FOUND', message: 'Team not found' }
      ));
    }

    const members = await query(
      `SELECT tm.*, u.email, u.full_name FROM team_members tm
       JOIN users u ON tm.user_id = u.user_id
       WHERE tm.team_id = ?`,
      [id]
    );

    team.members = members;
    res.json(formatResponse(true, { team }, 'Team retrieved'));
  }

  async updateTeam(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;
    const { team_name, description } = req.body;

    const team = await queryOne(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.team_id = tm.team_id
       WHERE t.team_id = ? AND tm.user_id = ? AND tm.role IN ('owner', 'admin')`,
      [id, userId]
    );

    if (!team) {
      return res.status(STATUS_CODES.FORBIDDEN).json(formatResponse(
        false, null, '', { code: 'FORBIDDEN', message: 'Not authorized' }
      ));
    }

    await query(
      'UPDATE teams SET team_name = ?, description = ?, updated_at = NOW() WHERE team_id = ?',
      [team_name || team.team_name, description !== undefined ? description : team.description, id]
    );

    const updatedTeam = await queryOne('SELECT * FROM teams WHERE team_id = ?', [id]);
    res.json(formatResponse(true, { team: updatedTeam }, 'Team updated'));
  }

  async deleteTeam(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;

    const team = await queryOne(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.team_id = tm.team_id
       WHERE t.team_id = ? AND tm.user_id = ? AND tm.role = 'owner'`,
      [id, userId]
    );

    if (!team) {
      return res.status(STATUS_CODES.FORBIDDEN).json(formatResponse(
        false, null, '', { code: 'FORBIDDEN', message: 'Only owner can delete team' }
      ));
    }

    await query('DELETE FROM teams WHERE team_id = ?', [id]);
    res.json(formatResponse(true, null, 'Team deleted'));
  }

  async addMember(req, res) {
    const { id } = req.params;
    const userId = req.user.user_id;
    const { member_user_id, role = 'member' } = req.body;

    const team = await queryOne(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.team_id = tm.team_id
       WHERE t.team_id = ? AND tm.user_id = ? AND tm.role IN ('owner', 'admin')`,
      [id, userId]
    );

    if (!team) {
      return res.status(STATUS_CODES.FORBIDDEN).json(formatResponse(
        false, null, '', { code: 'FORBIDDEN', message: 'Not authorized' }
      ));
    }

    await query(
      'INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
      [id, member_user_id, role]
    );

    res.status(STATUS_CODES.CREATED).json(formatResponse(true, null, 'Member added'));
  }

  async updateMember(req, res) {
    const { id, memberId } = req.params;
    const userId = req.user.user_id;
    const { role } = req.body;

    const team = await queryOne(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.team_id = tm.team_id
       WHERE t.team_id = ? AND tm.user_id = ? AND tm.role IN ('owner', 'admin')`,
      [id, userId]
    );

    if (!team) {
      return res.status(STATUS_CODES.FORBIDDEN).json(formatResponse(
        false, null, '', { code: 'FORBIDDEN', message: 'Not authorized' }
      ));
    }

    await query(
      'UPDATE team_members SET role = ? WHERE member_id = ? AND team_id = ?',
      [role, memberId, id]
    );

    res.json(formatResponse(true, null, 'Member updated'));
  }

  async removeMember(req, res) {
    const { id, memberId } = req.params;
    const userId = req.user.user_id;

    const team = await queryOne(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.team_id = tm.team_id
       WHERE t.team_id = ? AND tm.user_id = ? AND tm.role IN ('owner', 'admin')`,
      [id, userId]
    );

    if (!team) {
      return res.status(STATUS_CODES.FORBIDDEN).json(formatResponse(
        false, null, '', { code: 'FORBIDDEN', message: 'Not authorized' }
      ));
    }

    await query('DELETE FROM team_members WHERE member_id = ? AND team_id = ?', [memberId, id]);
    res.json(formatResponse(true, null, 'Member removed'));
  }
}

module.exports = new TeamController();
