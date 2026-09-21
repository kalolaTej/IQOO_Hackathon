/**
 * AgriSync - Logistics & Storage Routes
 * Owner: Tej
 */

const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');

// Logistics facility recommendations for a produce lot
router.get('/lots/:id/logistics-suggestion', logisticsController.getLogisticsSuggestion);

// List demo facilities
router.get('/logistics/facilities', logisticsController.getFacilitiesList);

// Storage Financial ROI Calculator
router.post('/logistics/calculate-roi', logisticsController.calculateStorageROI);

module.exports = router;
