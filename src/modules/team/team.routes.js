const express = require('express');
const router = express.Router();
const teamController = require('./team.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, teamController.getTeams);
router.post('/', authMiddleware, teamController.createTeam);
router.get('/:id', authMiddleware, teamController.getTeam);
router.put('/:id', authMiddleware, teamController.updateTeam);
router.delete('/:id', authMiddleware, teamController.deleteTeam);
router.post('/:id/members', authMiddleware, teamController.addMember);
router.put('/:id/members/:memberId', authMiddleware, teamController.updateMember);
router.delete('/:id/members/:memberId', authMiddleware, teamController.removeMember);

module.exports = router;
