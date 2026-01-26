const express = require('express');
const router = express.Router();
const nfcController = require('./nfc.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, nfcController.getCards);
router.post('/', authMiddleware, nfcController.createCard);
router.get('/:id', authMiddleware, nfcController.getCard);
router.put('/:id', authMiddleware, nfcController.updateCard);
router.delete('/:id', authMiddleware, nfcController.deleteCard);
router.post('/:id/activate', authMiddleware, nfcController.activateCard);
router.post('/:id/deactivate', authMiddleware, nfcController.deactivateCard);

module.exports = router;
