const express = require('express');
const router = express.Router();
const catalogController = require('./catalog.controller');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { checkFeatureAccess, checkLimit } = require('../../middleware/subscriptionCheck');
const validateRequest = require('../../middleware/validateRequest');
const { upload } = require('../../middleware/fileUpload');

// PUBLIC ROUTES
router.get('/:profileId/products', catalogController.getProducts);
router.get('/:profileId/search', catalogController.searchProducts);
router.get('/:profileId/products/:productId', catalogController.getProduct);

// PROTECTED ROUTES
router.post('/:profileId/products', authMiddleware, checkFeatureAccess('catalog'), checkLimit('catalog_products', 500), validateRequest('product'), catalogController.createProduct);
router.put('/:profileId/products/:productId', authMiddleware, checkFeatureAccess('catalog'), catalogController.updateProduct);
router.put('/:profileId/products/:productId/stock', authMiddleware, checkFeatureAccess('catalog'), catalogController.updateStock);
router.delete('/:profileId/products/:productId', authMiddleware, checkFeatureAccess('catalog'), catalogController.deleteProduct);
router.post('/:profileId/products/:productId/images', authMiddleware, checkFeatureAccess('catalog'), catalogController.addProductImage);
router.delete('/:profileId/products/:productId/images/:imageId', authMiddleware, checkFeatureAccess('catalog'), catalogController.deleteProductImage);
router.get('/:profileId/low-stock', authMiddleware, checkFeatureAccess('catalog'), catalogController.getLowStockProducts);

module.exports = router;
