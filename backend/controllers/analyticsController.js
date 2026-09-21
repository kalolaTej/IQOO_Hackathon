const supabase = require('../services/supabase');

exports.getPostHarvestAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let lotIds = null;

    // 1. Data Isolation for Farmer
    if (role === 'farmer') {
      const { data: farms, error: farmErr } = await supabase
        .from('farms')
        .select('id')
        .eq('user_id', userId);
        
      if (farmErr) {
        console.error('Error fetching farms:', farmErr);
        return res.status(500).json({ error: 'Failed to load post-harvest analytics.' });
      }

      const farmIds = (farms || []).map(f => f.id);

      if (farmIds.length === 0) {
        // Farmer has no farms, so no data
        return res.status(200).json(getEmptyResponse());
      }

      const { data: lots, error: lotErr } = await supabase
        .from('produce_lots')
        .select('id')
        .in('farm_id', farmIds);

      if (lotErr) {
        console.error('Error fetching lots:', lotErr);
        return res.status(500).json({ error: 'Failed to load post-harvest analytics.' });
      }

      lotIds = (lots || []).map(l => l.id);
      
      if (lotIds.length === 0) {
        // Farmer has farms but no lots, so no data
        return res.status(200).json(getEmptyResponse());
      }
    }

    // 2. Fetch Data
    
    // Lots
    let lotQuery = supabase.from('produce_lots').select('*');
    if (lotIds) lotQuery = lotQuery.in('id', lotIds);
    const { data: lots, error: lotsErr } = await lotQuery;

    // Bookings
    let bookingQuery = supabase.from('slot_bookings').select('*');
    if (lotIds) bookingQuery = bookingQuery.in('lot_id', lotIds);
    const { data: bookings, error: bookingsErr } = await bookingQuery;

    // Transactions
    let txQuery = supabase.from('transactions').select('*');
    if (lotIds) txQuery = txQuery.in('lot_id', lotIds);
    const { data: transactions, error: txErr } = await txQuery;

    // Incidents
    let incidentQuery = supabase.from('incidents').select('*');
    if (lotIds) incidentQuery = incidentQuery.in('lot_id', lotIds);
    const { data: incidents, error: incidentsErr } = await incidentQuery;

    // Matches
    let matchQuery = supabase.from('buyer_matches').select('*');
    if (lotIds) matchQuery = matchQuery.in('lot_id', lotIds);
    const { data: matches, error: matchesErr } = await matchQuery;

    if (lotsErr || bookingsErr || txErr || incidentsErr || matchesErr) {
      console.error('Error fetching aggregate data.');
      return res.status(500).json({ error: 'Failed to load post-harvest analytics.' });
    }

    // 3. Aggregate
    const response = getEmptyResponse();

    // -- Lots Aggregation --
    const cropMap = {};
    (lots || []).forEach(lot => {
      response.data.summary.total_lots += 1;
      const qty = parseFloat(lot.quantity_kg) || 0;
      response.data.summary.total_quantity_kg += qty;

      if (lot.status === 'listed') response.data.summary.listed_lots += 1;
      if (lot.status === 'booked') response.data.summary.booked_lots += 1;
      if (lot.status === 'matched') response.data.summary.matched_lots += 1;
      if (lot.status === 'sold') response.data.summary.sold_lots += 1;

      const grade = lot.grade || 'ungraded';
      if (response.data.grades[grade] !== undefined) {
        response.data.grades[grade] += 1;
      } else if (!lot.grade) {
        response.data.grades.ungraded += 1;
      }

      const crop = lot.crop_type || 'Unknown';
      if (!cropMap[crop]) {
        cropMap[crop] = { lot_count: 0, quantity_kg: 0 };
      }
      cropMap[crop].lot_count += 1;
      cropMap[crop].quantity_kg += qty;
    });

    response.data.crops = Object.keys(cropMap).map(c => ({
      crop_type: c,
      lot_count: cropMap[c].lot_count,
      quantity_kg: cropMap[c].quantity_kg
    }));

    // -- Procurement Aggregation --
    (bookings || []).forEach(b => {
      response.data.procurement.total_bookings += 1;
      if (b.status === 'waiting') response.data.procurement.waiting += 1;
      if (b.status === 'in_progress') response.data.procurement.in_progress += 1;
      if (b.status === 'completed') response.data.procurement.completed += 1;
      if (b.status === 'cancelled') response.data.procurement.cancelled += 1;
    });

    // -- Transaction Aggregation --
    (transactions || []).forEach(tx => {
      response.data.transactions.total += 1;
      
      if (tx.procurement_status === 'pending') response.data.transactions.pending += 1;
      if (tx.procurement_status === 'in_progress') response.data.transactions.in_progress += 1;
      if (tx.procurement_status === 'completed') response.data.transactions.completed += 1;

      if (tx.payment_status === 'unpaid') response.data.transactions.unpaid += 1;
      if (tx.payment_status === 'partial') response.data.transactions.partial += 1;
      if (tx.payment_status === 'paid') response.data.transactions.paid += 1;

      if (tx.amount !== null && !isNaN(parseFloat(tx.amount))) {
        response.data.transactions.total_amount += parseFloat(tx.amount);
      }
    });

    // -- Incident Aggregation --
    (incidents || []).forEach(inc => {
      response.data.incidents.total += 1;
      
      if (inc.status === 'open') response.data.incidents.open += 1;
      if (inc.status === 'investigating') response.data.incidents.investigating += 1;
      if (inc.status === 'resolved') response.data.incidents.resolved += 1;
      if (inc.status === 'dismissed') response.data.incidents.dismissed += 1;
      
      if (inc.severity === 'critical') response.data.incidents.critical += 1;
    });

    // -- Matching Aggregation --
    (matches || []).forEach(m => {
      response.data.matches.total += 1;
      
      if (m.status === 'suggested') response.data.matches.suggested += 1;
      if (m.status === 'contacted') response.data.matches.contacted += 1;
      if (m.status === 'accepted') response.data.matches.accepted += 1;
      if (m.status === 'rejected') response.data.matches.rejected += 1;
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Failed to load post-harvest analytics.' });
  }
};

const getEmptyResponse = () => ({
  data: {
    summary: {
      total_lots: 0,
      total_quantity_kg: 0,
      listed_lots: 0,
      booked_lots: 0,
      matched_lots: 0,
      sold_lots: 0
    },
    grades: {
      A: 0,
      B: 0,
      C: 0,
      ungraded: 0
    },
    crops: [],
    procurement: {
      total_bookings: 0,
      waiting: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    },
    transactions: {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      unpaid: 0,
      partial: 0,
      paid: 0,
      total_amount: 0
    },
    incidents: {
      total: 0,
      open: 0,
      investigating: 0,
      resolved: 0,
      dismissed: 0,
      critical: 0
    },
    matches: {
      total: 0,
      suggested: 0,
      contacted: 0,
      accepted: 0,
      rejected: 0
    }
  }
});
