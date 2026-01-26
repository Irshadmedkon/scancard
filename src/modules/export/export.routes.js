const express = require('express');
const router = express.Router();
const exportController = require('./export.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/profiles/csv', authMiddleware, exportController.exportProfilesCSV);
router.get('/profiles/excel', authMiddleware, exportController.exportProfilesExcel);
router.get('/leads/csv', authMiddleware, exportController.exportLeadsCSV);
router.get('/leads/excel', authMiddleware, exportController.exportLeadsExcel);
router.get('/analytics/pdf', authMiddleware, exportController.exportAnalyticsPDF);
router.get('/report', authMiddleware, exportController.generateReport);

module.exports = router;
