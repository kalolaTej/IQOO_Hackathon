const express = require('express');
const router = express.Router();
const mandiController = require('../controllers/mandiController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/mandi/prices - truthful representation of live market intelligence
router.get('/mandi/prices', authMiddleware, mandiController.getMandiPrices);

module.exports = router;
