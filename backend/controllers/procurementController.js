const supabase = require('../services/supabaseClient');

// 1. Discover procurement centres
const getCentres = async (req, res) => {
  try {
    const { data: centres, error } = await supabase
      .from('procurement_centres')
      .select('id, name, location, daily_capacity, operator_user_id');

    if (error) {
      return res.status(500).json({ error: `failed to fetch centres: ${error.message}` });
    }

    return res.status(200).json({ data: centres });
  } catch (err) {
    return res.status(500).json({ error: `internal server error: ${err.message}` });
  }
};

// 2. View available slots for a centre
const getCentreSlots = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if centre exists
    const { data: centre, error: centreError } = await supabase
      .from('procurement_centres')
      .select('id')
      .eq('id', id)
      .single();

    if (centreError || !centre) {
      return res.status(404).json({ error: 'Procurement centre not found' });
    }

    // Return slots for this centre
    const { data: slots, error } = await supabase
      .from('procurement_slots')
      .select('id, centre_id, slot_time, max_bookings, current_bookings')
      .eq('centre_id', id)
      .gte('slot_time', new Date().toISOString())
      .order('slot_time', { ascending: true });

    if (error) {
      return res.status(500).json({ error: `failed to fetch slots: ${error.message}` });
    }

    return res.status(200).json({ data: slots || [] });
  } catch (err) {
    return res.status(500).json({ error: `internal server error: ${err.message}` });
  }
};

// 3. Book a slot for a produce lot
const bookSlot = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const slotId = req.params.id;
    const { lot_id } = req.body;

    if (!lot_id) {
      return res.status(400).json({ error: 'lot_id is required' });
    }

    // Slot validation
    const { data: slot, error: slotError } = await supabase
      .from('procurement_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    // Capacity validation
    if (slot.current_bookings >= slot.max_bookings) {
      return res.status(400).json({ error: 'Slot is full' });
    }

    // Lot validation (ownership and status)
    const { data: lot, error: lotError } = await supabase
      .from('produce_lots')
      .select('*, farms!inner(user_id)')
      .eq('id', lot_id)
      .eq('farms.user_id', farmerId)
      .single();

    if (lotError || !lot) {
      return res.status(403).json({ error: 'Lot not found or does not belong to the authenticated farmer' });
    }

    if (lot.status !== 'listed') {
      return res.status(400).json({ error: 'Lot is not eligible for booking (status must be listed)' });
    }

    // Duplicate booking protection
    const { data: existingBooking } = await supabase
      .from('slot_bookings')
      .select('id')
      .eq('lot_id', lot_id)
      .in('status', ['waiting', 'in_progress'])
      .limit(1);

    if (existingBooking && existingBooking.length > 0) {
      return res.status(400).json({ error: 'Lot already has an active booking' });
    }

    // FIFO queue determination
    const { count } = await supabase
      .from('slot_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('slot_id', slotId);

    const queuePosition = (count || 0) + 1;

    // Booking Creation
    const { data: booking, error: insertError } = await supabase
      .from('slot_bookings')
      .insert([{
        slot_id: slotId,
        lot_id: lot_id,
        farmer_id: farmerId,
        queue_position: queuePosition,
        status: 'waiting'
      }])
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: `failed to create booking: ${insertError.message}` });
    }

    // Note: This naive read-modify-write pattern suffers from race conditions under high concurrency 
    // because Supabase REST JS does not natively support atomic increment without an RPC function.
    await supabase
      .from('procurement_slots')
      .update({ current_bookings: slot.current_bookings + 1 })
      .eq('id', slotId);

    await supabase
      .from('produce_lots')
      .update({ status: 'booked' })
      .eq('id', lot_id);

    // Emit Realtime Event
    const io = req.app.get('io');
    if (io) {
      io.emit('queue-updated', { centre_id: slot.centre_id });
    }

    return res.status(201).json({ data: booking });
  } catch (err) {
    return res.status(500).json({ error: `internal server error: ${err.message}` });
  }
};

// 4. Retrieve the current queue for a centre
const getQueue = async (req, res) => {
  try {
    const centreId = req.params.centre_id;

    // Check centre exists
    const { data: centre, error: centreError } = await supabase
      .from('procurement_centres')
      .select('id')
      .eq('id', centreId)
      .single();

    if (centreError || !centre) {
      return res.status(404).json({ error: 'Procurement centre not found' });
    }

    const { data: queue, error } = await supabase
      .from('slot_bookings')
      .select(`
        id, slot_id, lot_id, farmer_id, queue_position, status, booked_at,
        procurement_slots!inner(centre_id, slot_time),
        produce_lots(crop_type, quantity_kg)
      `)
      .eq('procurement_slots.centre_id', centreId)
      .order('queue_position', { ascending: true });

    if (error) {
      return res.status(500).json({ error: `failed to fetch queue: ${error.message}` });
    }

    return res.status(200).json({ data: queue || [] });
  } catch (err) {
    return res.status(500).json({ error: `internal server error: ${err.message}` });
  }
};

// 5. Allow procurement operators to advance booking status
const advanceBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status: newStatus } = req.body;

    const allowedTargetStatuses = ['in_progress', 'completed', 'cancelled'];
    if (!allowedTargetStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid booking status target' });
    }

    // Fetch existing booking
    const { data: booking, error: bookingError } = await supabase
      .from('slot_bookings')
      .select('*, procurement_slots(centre_id, current_bookings)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Lifecycle transition validation
    const validTransitions = {
      'waiting': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled']
    };

    if (!validTransitions[booking.status] || !validTransitions[booking.status].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid booking status transition' });
    }

    // Update status
    const { error: updateError } = await supabase
      .from('slot_bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (updateError) {
      return res.status(500).json({ error: `failed to update booking: ${updateError.message}` });
    }

    // Handle capacity and lot state if reaching terminal states
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      const currentCount = booking.procurement_slots.current_bookings;
      const newCount = Math.max(0, currentCount - 1);
      
      await supabase
        .from('procurement_slots')
        .update({ current_bookings: newCount })
        .eq('id', booking.slot_id);

      if (newStatus === 'cancelled') {
        // Free up the lot
        await supabase
          .from('produce_lots')
          .update({ status: 'listed' })
          .eq('id', booking.lot_id);
      }
    }

    // Emit Realtime Event
    const io = req.app.get('io');
    if (io) {
      io.emit('queue-updated', { centre_id: booking.procurement_slots.centre_id });
    }

    return res.status(200).json({ data: { ...booking, status: newStatus } });
  } catch (err) {
    return res.status(500).json({ error: `internal server error: ${err.message}` });
  }
};

module.exports = {
  getCentres,
  getCentreSlots,
  bookSlot,
  getQueue,
  advanceBooking
};
