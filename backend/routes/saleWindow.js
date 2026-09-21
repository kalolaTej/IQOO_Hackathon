const express = require('express');
const router = express.Router();
const saleWindowController = require('../controllers/saleWindowController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/lots/:lot_id/sale-window
router.get('/lots/:lot_id/sale-window', authMiddleware, saleWindowController.getSaleWindowRecommendation);

module.exports = router;
