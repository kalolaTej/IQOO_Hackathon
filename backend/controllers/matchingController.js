const supabase = require('../services/supabase');

const { calculateMatchScore } = require('../services/matchingService');

// GET /api/matches/:lot_id
exports.getMatchesForLot = async (req, res) => {
  try {
    const lotId = req.params.lot_id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // First fetch the lot to check ownership and data
    const { data: lot, error: lotError } = await supabase
      .from('produce_lots')
      .select('*, farms(user_id, location)')
      .eq('id', lotId)
      .single();

    if (lotError || !lot) {
      return res.status(404).json({ error: 'Produce lot not found.' });
    }

    // Authorization
    if (userRole === 'farmer' && lot.farms.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to access matches for this lot.' });
    }

    // We do NOT persist matches on GET to avoid silent DB side-effects and concurrency locks.
    // Instead, we dynamically evaluate rules on the fly and merge with any existing persisted status.
    
    // Fetch active demand profiles
    const { data: demandProfiles, error: demandError } = await supabase
      .from('buyer_demand_profiles')
      .select('*, users(name, email)')
      .eq('active', true);

    if (demandError) {
      throw demandError;
    }

    // Fetch previously persisted matches (if any, like accepted/contacted)
    const { data: existingMatches, error: matchesError } = await supabase
      .from('buyer_matches')
      .select('*')
      .eq('lot_id', lotId);
      
    if (matchesError) throw matchesError;

    const existingMatchMap = {};
    existingMatches.forEach(m => { existingMatchMap[m.buyer_id] = m; });

    const computedMatches = [];

    for (const profile of demandProfiles) {
      // If buyer role, only show their own matches
      if (userRole === 'buyer' && profile.buyer_id !== userId) {
        continue;
      }

      // Check if a persisted match exists
      const existing = existingMatchMap[profile.buyer_id];
      if (existing) {
        // Return existing persisted match, but refresh score logic purely for accuracy, 
        // though the requirement says do not edit score. We'll stick to DB values if persisted.
        computedMatches.push({
          ...existing,
          buyer_name: profile.users?.name,
          is_demo: profile.is_demo
        });
      } else {
        // Evaluate dynamic match
        const { score, reasons } = calculateMatchScore(lot, profile);
        if (score > 0) { // Only yield compatible matches
          computedMatches.push({
            id: null, // Indicates unpersisted "suggested" match
            lot_id: lotId,
            buyer_id: profile.buyer_id,
            match_score: score,
            match_reasons: reasons,
            status: 'suggested',
            buyer_name: profile.users?.name,
            is_demo: profile.is_demo,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // Sort by descending rule score
    computedMatches.sort((a, b) => b.match_score - a.match_score);

    return res.status(200).json({ data: computedMatches });
  } catch (error) {
    console.error('Error fetching buyer matches:', error);
    return res.status(500).json({ error: 'Failed to evaluate buyer matching.' });
  }
};

// PATCH /api/matches/:id
// Because matches are dynamic until interacted with, the client must PUT/PATCH 
// to 'persist' a match interaction (e.g. contact or accept). 
// Since :id might be 'new' or a UUID, we handle both by lot_id/buyer_id.
exports.updateMatchStatus = async (req, res) => {
  try {
    const { id } = req.params; 
    const { status, lot_id, buyer_id, match_score, match_reasons } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['suggested', 'contacted', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid match status.' });
    }

    // Determine if we need to insert or update.
    let matchRecord = null;
    
    if (id && id.length > 10 && id !== 'new') {
      const { data: existing, error: getErr } = await supabase
        .from('buyer_matches')
        .select('*, produce_lots(farms(user_id))')
        .eq('id', id)
        .single();
        
      if (getErr || !existing) return res.status(404).json({ error: 'Match record not found.' });
      matchRecord = existing;
    }

    // Authorization
    if (matchRecord) {
      if (userRole === 'buyer' && matchRecord.buyer_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to update this match.' });
      }
      if (userRole === 'farmer' && matchRecord.produce_lots?.farms?.user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to update this match.' });
      }
    } else {
      // Ensure the user trying to persist a new interaction is authorized
      if (userRole === 'buyer' && buyer_id !== userId) {
         return res.status(403).json({ error: 'Unauthorized to act on behalf of another buyer.' });
      }
      // If it's a new match being persisted, we insert it.
      if (!lot_id || !buyer_id) {
         return res.status(400).json({ error: 'lot_id and buyer_id required to persist interaction.' });
      }
      
      // compute score server-side to prevent client spoofing
      const { data: lotData } = await supabase.from('produce_lots').select('*, farms(user_id, location)').eq('id', lot_id).single();
      const { data: profileData } = await supabase.from('buyer_demand_profiles').select('*').eq('buyer_id', buyer_id).single();
      
      if (!lotData || !profileData) return res.status(400).json({ error: 'Invalid lot or buyer.' });
      
      // Enforce farmer ownership when persisting a new match
      if (userRole === 'farmer' && lotData.farms?.user_id !== userId) {
         return res.status(403).json({ error: 'Unauthorized to create match for this lot.' });
      }
      
      const { score, reasons } = calculateMatchScore(lotData, profileData);
      
      const { data: inserted, error: insertErr } = await supabase
        .from('buyer_matches')
        .insert([{
          lot_id,
          buyer_id,
          match_score: score,
          match_reasons: reasons,
          status
        }])
        .select()
        .single();
        
      if (insertErr) {
        if (insertErr.code === '23505') {
          return res.status(409).json({ error: 'A match already exists for this lot and buyer.' });
        }
        return res.status(500).json({ error: 'Failed to persist match.' });
      }
      matchRecord = inserted;
    }

    // Perform Update if it was already persisted
    if (id && id.length > 10 && id !== 'new') {
      const { data: updated, error: updateErr } = await supabase
        .from('buyer_matches')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
        
      if (updateErr) return res.status(500).json({ error: 'Failed to update match status.' });
      matchRecord = updated;
    }

    // Transaction creation is intentionally DEFERRED.
    // The previous implementation used a check-then-insert which is not concurrency-safe
    // under heavy load without a unique constraint on transactions(lot_id).
    // Accepting a match updates the match status only. 
    // Creating the financial transaction belongs to a dedicated, concurrency-safe procurement pipeline.

    return res.status(200).json({ data: matchRecord });
  } catch (error) {
    console.error('Error updating match:', error);
    return res.status(500).json({ error: 'Failed to update match.' });
  }
};
