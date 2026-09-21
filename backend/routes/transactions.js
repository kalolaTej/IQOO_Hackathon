const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const {
  getTransactionByLot,
  updateTransaction
} = require('../controllers/transactionController');

const router = express.Router();

// 1. Retrieve transaction information for a produce lot
// Authorization handled in controller (farmers, buyers, operators, admins can access selectively)
router.get('/:lot_id', authMiddleware, getTransactionByLot);

// 2. Update procurement/payment status or amount
// Only operators and admins can update transactions in this phase
router.patch('/:id', authMiddleware, requireRole('procurement_operator', 'admin'), updateTransaction);

module.exports = router;
