const supabase = require('../services/supabaseClient');

/**
 * NOTE: Transaction creation is intentionally deferred.
 * Phase 3 provides status tracking and update APIs for transaction records that already exist.
 * A future buyer-matching/procurement-assignment workflow will create the transaction record.
 */

// 1. Retrieve transaction for a produce lot
const getTransactionByLot = async (req, res) => {
  try {
    const lotId = req.params.lot_id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch the transaction with lot ownership details
    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .select('*, produce_lots!inner(farms!inner(user_id))')
      .eq('lot_id', lotId)
      .single();

    if (txnError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Authorization checks
    let isAuthorized = false;
    if (userRole === 'admin' || userRole === 'procurement_operator') {
      isAuthorized = true;
    } else if (userRole === 'farmer') {
      // Farmer can access if they own the lot
      if (transaction.produce_lots.farms.user_id === userId) {
        isAuthorized = true;
      }
    } else if (userRole === 'buyer') {
      // Buyer can access if they are the assigned buyer
      if (transaction.buyer_id === userId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized to access this transaction' });
    }

    // Strip nested joins before returning
    const { produce_lots, ...cleanTransaction } = transaction;
    return res.status(200).json({ data: cleanTransaction });
  } catch (err) {
    return res.status(500).json({ error: `internal server error: ${err.message}` });
  }
};

// 2. Update transaction status/details
const updateTransaction = async (req, res) => {
  try {
    const txnId = req.params.id;
    const { procurement_status, payment_status, amount } = req.body;

    // Fetch the transaction
    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', txnId)
      .single();

    if (txnError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Prepare updates
    const updates = {};
    const validProcurementTransitions = {
      'pending': ['in_progress'],
      'in_progress': ['completed']
    };
    const validPaymentTransitions = {
      'unpaid': ['partial', 'paid'],
      'partial': ['paid']
    };

    if (procurement_status) {
      if (!['pending', 'in_progress', 'completed'].includes(procurement_status)) {
         return res.status(400).json({ error: 'Invalid procurement status target' });
      }
      if (procurement_status !== transaction.procurement_status) {
        const allowed = validProcurementTransitions[transaction.procurement_status] || [];
        if (!allowed.includes(procurement_status)) {
          return res.status(400).json({ error: 'Invalid procurement status transition' });
        }
        updates.procurement_status = procurement_status;
      }
    }

    if (payment_status) {
      if (!['unpaid', 'partial', 'paid'].includes(payment_status)) {
         return res.status(400).json({ error: 'Invalid payment status target' });
      }
      if (payment_status !== transaction.payment_status) {
        const allowed = validPaymentTransitions[transaction.payment_status] || [];
        if (!allowed.includes(payment_status)) {
          return res.status(400).json({ error: 'Invalid payment status transition' });
        }
        updates.payment_status = payment_status;
      }
    }

    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (Number.isNaN(numericAmount) || !Number.isFinite(numericAmount) || numericAmount < 0) {
        return res.status(400).json({ error: 'Invalid transaction amount' });
      }
      updates.amount = numericAmount;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Force server-side updated_at
    updates.updated_at = new Date().toISOString();

    // Execute update
    const { data: updatedTxn, error: updateError } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', txnId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: `failed to update transaction: ${updateError.message}` });
    }

    return res.status(200).json({ data: updatedTxn });
  } catch (err) {
    return res.status(500).json({ error: `internal server error: ${err.message}` });
  }
};

module.exports = {
  getTransactionByLot,
  updateTransaction
};
