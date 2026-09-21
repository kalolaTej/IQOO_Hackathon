const express = require('express');
const incidentController = require('../controllers/incidentController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Pre-Harvest & Post-Harvest Unified Incident Creation
// Allowed: farmer, procurement_operator, admin
router.post('/incidents', authMiddleware, requireRole(['farmer', 'procurement_operator', 'admin']), incidentController.createIncident);

// Pre-Harvest: List crop-loss incidents
router.get('/incidents', authMiddleware, incidentController.getIncidents);

// Pre-Harvest: Crop-loss incident analytics
router.get('/incidents/analytics', authMiddleware, incidentController.getIncidentAnalytics);

// Post-Harvest: List incidents by produce lot ID
// Allowed: farmer, procurement_operator, admin
router.get('/incidents/:lot_id', authMiddleware, requireRole(['farmer', 'procurement_operator', 'admin']), incidentController.getIncidentsByLot);

// Post-Harvest: Update incident status / resolution notes
// Allowed: procurement_operator, admin
router.patch('/incidents/:id', authMiddleware, requireRole(['procurement_operator', 'admin']), incidentController.updateIncident);

module.exports = router;
