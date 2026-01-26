const { query, queryOne } = require('../../config/database');
const logger = require('../../utils/logger');

class TeamService {
  /**
   * Get all teams for user
   */
  async getTeams(userId) {
    const teams = await query(
      `SELECT t.*, COUNT(tm.member_id) as member_count
       FROM teams t
       LEFT JOIN team_members tm ON t.team_id = tm.team_id
       WHERE t.user_id = ?
       GROUP BY t.team_id
       ORDER BY t.created_at DESC`,
      [userId]
    );

    return teams;
  }

  /**
   * Create new team
   */
  async createTeam(userId, teamData) {
    const { team_name, description } = teamData;

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

    logger.info('Team created', { userId, teamId: result.insertId });

    return team;
  }

  /**
   * Get team by ID with members
   */
  async getTeamById(teamId, userId) {
    const team = await queryOne(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.team_id = tm.team_id
       WHERE t.team_id = ? AND tm.user_id = ?`,
      [teamId, userId]
    );

    if (!team) {
      throw new Error('Team not found');
    }

    // Get team members
    const members = await query(
      `SELECT tm.*, u.email, u.full_name 
       FROM team_members tm
       JOIN users u ON tm.user_id = u.user_id
       WHERE tm.team_id = ?`,
      [teamId]
    );

    team.members = members;

    return team;
  }

  /**
   * Update team
   */
  async updateTeam(teamId, userId, updates) {
    // Check if user is owner or admin
    const member = await queryOne(
      `SELECT tm.* FROM team_members tm
       WHERE tm.team_id = ? AND tm.user_id = ? AND tm.role IN ('owner', 'admin')`,
      [teamId, userId]
    );

    if (!member) {
      throw new Error('Not authorized to update team');
    }

    const { team_name, description } = updates;

    const updateFields = [];
    const updateValues = [];

    if (team_name) {
      updateFields.push('team_name = ?');
      updateValues.push(team_name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateValues.push(teamId);
      await query(`UPDATE teams SET ${updateFields.join(', ')} WHERE team_id = ?`, updateValues);
    }

    const updatedTeam = await queryOne('SELECT * FROM teams WHERE team_id = ?', [teamId]);

    logger.info('Team updated', { userId, teamId });

    return updatedTeam;
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId, userId) {
    // Check if user is owner
    const member = await queryOne(
      `SELECT tm.* FROM team_members tm
       WHERE tm.team_id = ? AND tm.user_id = ? AND tm.role = 'owner'`,
      [teamId, userId]
    );

    if (!member) {
      throw new Error('Only owner can delete team');
    }

    await query('DELETE FROM teams WHERE team_id = ?', [teamId]);

    logger.info('Team deleted', { userId, teamId });
  }

  /**
   * Add team member
   */
  async addMember(teamId, userId, memberData) {
    const { member_user_id, role = 'member' } = memberData;

    // Check if user is owner or admin
    const requester = await queryOne(
      `SELECT tm.* FROM team_members tm
       WHERE tm.team_id = ? AND tm.user_id = ? AND tm.role IN ('owner', 'admin')`,
      [teamId, userId]
    );

    if (!requester) {
      throw new Error('Not authorized to add members');
    }

    // Check if member already exists
    const existing = await queryOne(
      'SELECT member_id FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, member_user_id]
    );

    if (existing) {
      throw new Error('User is already a team member');
    }

    await query(
      'INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
      [teamId, member_user_id, role]
    );

    logger.info('Team member added', { userId, teamId, memberId: member_user_id });
  }

  /**
   * Update team member role
   */
  async updateMember(teamId, memberId, userId, role) {
    // Check if user is owner or admin
    const requester = await queryOne(
      `SELECT tm.* FROM team_members tm
       WHERE tm.team_id = ? AND tm.user_id = ? AND tm.role IN ('owner', 'admin')`,
      [teamId, userId]
    );

    if (!requester) {
      throw new Error('Not authorized to update members');
    }

    await query(
      'UPDATE team_members SET role = ? WHERE member_id = ? AND team_id = ?',
      [role, memberId, teamId]
    );

    logger.info('Team member updated', { userId, teamId, memberId });
  }

  /**
   * Remove team member
   */
  async removeMember(teamId, memberId, userId) {
    // Check if user is owner or admin
    const requester = await queryOne(
      `SELECT tm.* FROM team_members tm
       WHERE tm.team_id = ? AND tm.user_id = ? AND tm.role IN ('owner', 'admin')`,
      [teamId, userId]
    );

    if (!requester) {
      throw new Error('Not authorized to remove members');
    }

    // Don't allow removing owner
    const member = await queryOne(
      'SELECT role FROM team_members WHERE member_id = ? AND team_id = ?',
      [memberId, teamId]
    );

    if (member && member.role === 'owner') {
      throw new Error('Cannot remove team owner');
    }

    await query('DELETE FROM team_members WHERE member_id = ? AND team_id = ?', [memberId, teamId]);

    logger.info('Team member removed', { userId, teamId, memberId });
  }
}

module.exports = new TeamService();
