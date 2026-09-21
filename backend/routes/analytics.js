const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/analytics/post-harvest
// Allowed: farmer, procurement_operator, admin
router.get('/post-harvest', authMiddleware, requireRole(['farmer', 'procurement_operator', 'admin']), analyticsController.getPostHarvestAnalytics);

module.exports = router;
