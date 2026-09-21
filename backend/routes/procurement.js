const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const {
  getCentres,
  getCentreSlots,
  bookSlot,
  getQueue,
  advanceBooking
} = require('../controllers/procurementController');

const router = express.Router();

// 1. Discover procurement centres
router.get('/centres', authMiddleware, requireRole('farmer'), getCentres);

// 2. View available slots for a centre
router.get('/centres/:id/slots', authMiddleware, requireRole('farmer'), getCentreSlots);

// 3. Book a slot for a produce lot
router.post('/slots/:id/book', authMiddleware, requireRole('farmer'), bookSlot);

// 4. Retrieve the current queue for a centre
router.get('/queue/:centre_id', authMiddleware, requireRole('farmer', 'procurement_operator', 'apmc'), getQueue);

// 5. Allow procurement operators to advance booking status
router.patch('/bookings/:id/advance', authMiddleware, requireRole('procurement_operator', 'apmc'), advanceBooking);

module.exports = router;
