const express = require('express');
const router = express.Router();
const leadController = require('./lead.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const validateRequest = require('../../middleware/validateRequest');

router.get('/', authMiddleware, leadController.getLeads);
router.get('/export/csv', authMiddleware, leadController.exportCSV);
router.post('/', validateRequest('lead'), leadController.createLead);
router.get('/:id', authMiddleware, leadController.getLead);
router.put('/:id', authMiddleware, leadController.updateLead);
router.put('/:id/status', authMiddleware, leadController.updateLeadStatus);
router.put('/:id/archive', authMiddleware, leadController.archiveLead);
router.delete('/:id', authMiddleware, leadController.deleteLead);

module.exports = router;
