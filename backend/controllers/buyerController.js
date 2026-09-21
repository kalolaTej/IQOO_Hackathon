/**
 * AgriSync - Buyer Controller
 * Buyer demand profile creation & multi-factor rule-based matching.
 * Owner: Tej
 */

const { v4: uuidv4 } = require('crypto');
const supabase = require('../services/supabaseClient');
const { MOCK_BUYER_PROFILES, MOCK_PRODUCE_LOTS } = require('../mock/marketMockData');

// Runtime storage fallback in case database connection is in fallback mode
const runtimeBuyerProfiles = [...MOCK_BUYER_PROFILES];
const runtimeMatches = new Map();

/**
 * Helper to generate a random UUID v4 if crypto/db is offline
 */
const generateId = () => {
  return 'b' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
};

/**
 * Calculate multi-factor match score between a produce lot and a buyer profile
 * Rule-based weighted scoring:
 * - Crop match: 40% (required - 0 if crop differs)
 * - Quantity fit: 25% (full points if lot satisfies or exceeds buyer min quantity)
 * - Grade compatibility: 20% (exact match / Grade A fulfillment)
 * - Location proximity: 15% (same state/region)
 */
const calculateMatchScore = (lot, buyer) => {
  const lotCrop = (lot.crop_type || '').toLowerCase().trim();
  const buyerCrop = (buyer.crop_type || '').toLowerCase().trim();

  // Hard prerequisite: Crop types must match
  if (!lotCrop || !buyerCrop || (!lotCrop.includes(buyerCrop) && !buyerCrop.includes(lotCrop))) {
    return 0;
  }

  let score = 40; // Crop match base score

  // 1. Quantity fit (max 25 pts)
  const lotQty = parseFloat(lot.quantity_kg) || 0;
  const buyerMinQty = parseFloat(buyer.min_quantity_kg) || 0;
  if (buyerMinQty > 0) {
    if (lotQty >= buyerMinQty) {
      score += 25;
    } else if (lotQty >= 0.75 * buyerMinQty) {
      score += 18;
    } else if (lotQty >= 0.5 * buyerMinQty) {
      score += 12;
    } else {
      score += Math.round((lotQty / buyerMinQty) * 10);
    }
  } else {
    score += 20;
  }

  // 2. Grade compatibility (max 20 pts)
  const lotGrade = (lot.grade || 'A').toUpperCase();
  const buyerPref = (buyer.preferred_grade || 'any').toUpperCase();

  if (buyerPref === 'ANY' || buyerPref === lotGrade) {
    score += 20;
  } else if (lotGrade === 'A' && buyerPref === 'B') {
    score += 18; // Premium lot offered to standard request
  } else if (lotGrade === 'B' && buyerPref === 'A') {
    score += 10;
  } else {
    score += 5;
  }

  // 3. Location proximity (max 15 pts)
  const lotLoc = (lot.location || lot.state || '').toLowerCase();
  const buyerLoc = (buyer.location || buyer.state || '').toLowerCase();

  if (lotLoc && buyerLoc && (lotLoc.includes(buyerLoc) || buyerLoc.includes(lotLoc))) {
    score += 15;
  } else if (lot.state && buyer.state && lot.state.toLowerCase() === buyer.state.toLowerCase()) {
    score += 12;
  } else {
    score += 6;
  }

  return Math.min(100, Math.max(0, score));
};

/**
 * POST /api/buyer-profile
 * Request: { crop_type, min_quantity_kg, preferred_grade, location }
 * Response 201: buyer profile object with id
 */
const createBuyerProfile = async (req, res) => {
  try {
    const { crop_type, min_quantity_kg, preferred_grade, location, buyer_name, company_name, state, contact_phone } = req.body;

    if (!crop_type || min_quantity_kg === undefined || !preferred_grade || !location) {
      return res.status(400).json({
        error: 'Missing required buyer profile fields (crop_type, min_quantity_kg, preferred_grade, location)',
      });
    }

    const minQty = parseFloat(min_quantity_kg);
    if (isNaN(minQty) || minQty <= 0) {
      return res.status(400).json({ error: 'min_quantity_kg must be a positive number' });
    }

    const userId = req.user ? req.user.id : null;
    const profilePayload = {
      buyer_name: buyer_name || req.user?.name || 'Commercial Agri Buyer',
      company_name: company_name || 'Agri Sourcing Co',
      crop_type: crop_type.trim(),
      min_quantity_kg: minQty,
      preferred_grade: preferred_grade.trim(),
      location: location.trim(),
      state: state || 'Maharashtra',
      contact_phone: contact_phone || '+91-9876543210',
      user_id: userId,
    };

    let createdProfile = null;

    try {
      const { data, error } = await supabase
        .from('buyer_demand_profiles')
        .insert([profilePayload])
        .select()
        .single();

      if (!error && data) {
        createdProfile = data;
      }
    } catch (dbErr) {
      console.debug(`[buyer profile] DB insert note: ${dbErr.message}`);
    }

    if (!createdProfile) {
      // In-memory fallback
      createdProfile = {
        id: generateId(),
        ...profilePayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      runtimeBuyerProfiles.unshift(createdProfile);
    }

    return res.status(201).json(createdProfile);
  } catch (err) {
    console.error('[createBuyerProfile error]', err);
    return res.status(500).json({ error: `Failed to create buyer profile: ${err.message}` });
  }
};

/**
 * GET /api/lots/:id/matches
 * Auth: Farmer
 * Response 200: [{ "buyer_id", "match_score", "status": "suggested", ... }]
 */
const getLotMatches = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Lot ID is required' });
    }

    // 1. Fetch the target lot
    let lot = null;
    try {
      const { data, error } = await supabase
        .from('produce_lots')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        lot = data;
      }
    } catch (err) {
      console.debug(`[lot matches] DB query note: ${err.message}`);
    }

    if (!lot) {
      lot = MOCK_PRODUCE_LOTS.find((l) => l.id === id) || {
        id,
        crop_type: 'Tomato',
        quantity_kg: 1000,
        grade: 'A',
        location: 'Somala',
        state: 'Andhra Pradesh',
      };
    }

    // 2. Fetch all buyer demand profiles
    let buyers = [];
    try {
      const { data, error } = await supabase.from('buyer_demand_profiles').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        buyers = data;
      }
    } catch (err) {
      console.debug(`[lot matches] DB query note: ${err.message}`);
    }

    if (buyers.length === 0) {
      buyers = [...runtimeBuyerProfiles];
    }

    // 3. Score each buyer
    const matches = buyers
      .map((buyer) => {
        const score = calculateMatchScore(lot, buyer);
        const matchId = `match_${lot.id}_${buyer.id}`;
        const existingStatus = runtimeMatches.get(matchId)?.status || 'suggested';

        return {
          id: matchId,
          buyer_id: buyer.id,
          buyer_name: buyer.buyer_name || buyer.company_name || 'Agri Buyer',
          company_name: buyer.company_name,
          crop_type: buyer.crop_type,
          min_quantity_kg: buyer.min_quantity_kg,
          preferred_grade: buyer.preferred_grade,
          location: buyer.location,
          contact_phone: buyer.contact_phone,
          match_score: score,
          status: existingStatus,
        };
      })
      .filter((m) => m.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score);

    return res.status(200).json(matches);
  } catch (err) {
    console.error('[getLotMatches error]', err);
    return res.status(500).json({ error: `Failed to retrieve lot matches: ${err.message}` });
  }
};

/**
 * GET /api/buyers/:id/matches
 * Auth: Buyer
 * Response 200: [{ "lot_id", "match_score", "status", ... }]
 */
const getBuyerMatches = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Buyer ID is required' });
    }

    // 1. Fetch buyer profile
    let buyer = null;
    try {
      const { data, error } = await supabase
        .from('buyer_demand_profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        buyer = data;
      }
    } catch (err) {
      console.debug(`[buyer matches] DB note: ${err.message}`);
    }

    if (!buyer) {
      buyer = runtimeBuyerProfiles.find((b) => b.id === id) || {
        id,
        buyer_name: 'Registered Agro Buyer',
        crop_type: 'Tomato',
        min_quantity_kg: 500,
        preferred_grade: 'A',
        location: 'Nashik',
        state: 'Maharashtra',
      };
    }

    // 2. Fetch lots
    let lots = [];
    try {
      const { data, error } = await supabase.from('produce_lots').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        lots = data;
      }
    } catch (err) {
      console.debug(`[buyer lots query] DB note: ${err.message}`);
    }

    if (lots.length === 0) {
      lots = [...MOCK_PRODUCE_LOTS];
    }

    // 3. Score lots
    const matches = lots
      .map((lot) => {
        const score = calculateMatchScore(lot, buyer);
        const matchId = `match_${lot.id}_${buyer.id}`;
        const existingStatus = runtimeMatches.get(matchId)?.status || 'suggested';

        return {
          id: matchId,
          lot_id: lot.id,
          crop_type: lot.crop_type,
          quantity_kg: lot.quantity_kg,
          grade: lot.grade,
          harvest_date: lot.harvest_date,
          match_score: score,
          status: existingStatus,
        };
      })
      .filter((m) => m.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score);

    return res.status(200).json(matches);
  } catch (err) {
    console.error('[getBuyerMatches error]', err);
    return res.status(500).json({ error: `Failed to retrieve buyer matches: ${err.message}` });
  }
};

/**
 * PATCH /api/matches/:id
 * Request: { status: "interested" | "accepted" | "rejected" }
 * Response 200: updated match object
 */
const updateMatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['interested', 'accepted', 'rejected', 'suggested'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updatedMatch = {
      id,
      status,
      notes: notes || '',
      updated_at: new Date().toISOString(),
    };

    runtimeMatches.set(id, updatedMatch);

    // Attempt updating in Supabase buyer_matches table if it's a UUID match record
    try {
      await supabase
        .from('buyer_matches')
        .upsert({
          id,
          status,
          notes: notes || '',
          updated_at: new Date().toISOString(),
        })
        .select();
    } catch (err) {
      console.debug(`[match status] DB note: ${err.message}`);
    }

    return res.status(200).json(updatedMatch);
  } catch (err) {
    console.error('[updateMatchStatus error]', err);
    return res.status(500).json({ error: `Failed to update match status: ${err.message}` });
  }
};

/**
 * GET /api/buyer-profile (Helper endpoint to list buyer profiles)
 */
const getBuyerProfiles = async (req, res) => {
  try {
    let profiles = [];
    try {
      const { data, error } = await supabase.from('buyer_demand_profiles').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        profiles = data;
      }
    } catch (err) {
      console.debug(`[getBuyerProfiles] DB note: ${err.message}`);
    }

    if (profiles.length === 0) {
      profiles = [...runtimeBuyerProfiles];
    }

    return res.status(200).json(profiles);
  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch buyer profiles: ${err.message}` });
  }
};

module.exports = {
  createBuyerProfile,
  getLotMatches,
  getBuyerMatches,
  updateMatchStatus,
  getBuyerProfiles,
  calculateMatchScore,
};
