const express = require('express');
const router = express.Router();
const searchController = require('./search.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/profiles', searchController.searchProfiles);
router.get('/leads', authMiddleware, searchController.searchLeads);
router.get('/global', authMiddleware, searchController.globalSearch);
router.get('/suggestions', searchController.getSuggestions);

module.exports = router;
