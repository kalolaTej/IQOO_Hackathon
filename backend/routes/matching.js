const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/matches/:lot_id
router.get('/matches/:lot_id', authMiddleware, matchingController.getMatchesForLot);

// PATCH /api/matches/:id
router.patch('/matches/:id', authMiddleware, matchingController.updateMatchStatus);

module.exports = router;
