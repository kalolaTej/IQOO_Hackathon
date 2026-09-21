/**
 * AgriSync - Buyer Demand & Matching Routes
 * Owner: Tej
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const buyerController = require('../controllers/buyerController');

// Buyer profile management
router.post('/buyer-profile', authMiddleware, buyerController.createBuyerProfile);
router.get('/buyer-profile', authMiddleware, buyerController.getBuyerProfiles);

// Produce lot to buyer matching
router.get('/lots/:id/matches', authMiddleware, buyerController.getLotMatches);

// Buyer to produce lot matching
router.get('/buyers/:id/matches', authMiddleware, buyerController.getBuyerMatches);

// Match status update (interested / accepted / rejected)
router.patch('/matches/:id', authMiddleware, buyerController.updateMatchStatus);

module.exports = router;
