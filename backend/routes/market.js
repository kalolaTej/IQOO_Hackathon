/**
 * AgriSync - Market Intelligence Routes
 * Owner: Tej
 */

const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');

// Mandi Prices (standard and normalized alias endpoints)
router.get('/prices', marketController.getPrices);
router.get('/market-prices', marketController.getPrices);
router.get('/market-prices/single', marketController.getSingleCrop);
router.get('/market-price', marketController.getSingleCrop);

// Trend & Arbitrage Endpoints
router.get('/prices/trend', marketController.getTrend);
router.get('/prices/arbitrage', marketController.getArbitrage);

// Sale-Window Recommendation & Interactive Simulation
router.get('/lots/:id/sale-window', marketController.getSaleWindow);
router.get('/sale-window', marketController.getSaleWindow);
router.post('/sale-window/simulate', marketController.simulateSaleWindow);

module.exports = router;
