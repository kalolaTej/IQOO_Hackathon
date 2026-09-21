/**
 * AgriSync - Logistics Controller
 * Rule-based logistics, storage facility recommendations & Storage ROI Calculator.
 * Owner: Tej
 */

const supabase = require('../services/supabaseClient');
const { MOCK_LOGISTICS_FACILITIES, MOCK_PRODUCE_LOTS } = require('../mock/marketMockData');

// Perishability classification for storage matching
const PERISHABLE_CROPS = ['tomato', 'cabbage', 'cauliflower', 'strawberry', 'grapes', 'banana', 'mango', 'vegetable'];
const SEMI_PERISHABLE_CROPS = ['onion', 'potato', 'garlic', 'apple', 'orange'];

/**
 * Score a logistics facility for a given produce lot
 */
const scoreFacility = (lot, facility) => {
  const crop = (lot.crop_type || 'Tomato').toLowerCase().trim();
  const quantity = parseFloat(lot.quantity_kg) || 1000;
  const isPerishable = PERISHABLE_CROPS.some((c) => crop.includes(c));
  const isSemiPerishable = SEMI_PERISHABLE_CROPS.some((c) => crop.includes(c));

  let score = 50;
  let reasonParts = [];

  if (isPerishable) {
    if (facility.type === 'cold_storage') {
      score += 35;
      reasonParts.push(`Temperature-controlled cold storage preserves fresh ${lot.crop_type}`);
    } else if (facility.type === 'transport_provider' && facility.perishable_compatible) {
      score += 20;
      reasonParts.push(`Fast refrigerated transport suited for immediate dispatch`);
    } else {
      score -= 30;
      reasonParts.push(`Dry ambient warehouse (not ideal for perishable produce)`);
    }
  } else if (isSemiPerishable) {
    if (facility.type === 'cold_storage' || facility.type === 'warehouse') {
      score += 25;
      reasonParts.push(`Well-ventilated storage suitable for ${lot.crop_type}`);
    } else {
      score += 15;
    }
  } else {
    if (facility.type === 'warehouse') {
      score += 35;
      reasonParts.push(`Economical bulk warehouse storage ideal for dry ${lot.crop_type}`);
    } else if (facility.type === 'cold_storage') {
      score -= 10;
      reasonParts.push(`Cold storage (higher cost than necessary for dry grain)`);
    } else {
      score += 20;
      reasonParts.push(`Direct transport provider for bulk grain transit`);
    }
  }

  if (facility.capacity_kg >= quantity) {
    score += 15;
  } else {
    score -= 25;
    reasonParts.push(`Capacity (${facility.capacity_kg} kg) smaller than lot size (${quantity} kg)`);
  }

  if (facility.cost_per_day <= 250) {
    score += 10;
    reasonParts.push(`cost-effective rate of ₹${facility.cost_per_day}/day`);
  } else if (facility.cost_per_day <= 500) {
    score += 5;
    reasonParts.push(`standard rate of ₹${facility.cost_per_day}/day`);
  }

  let estimatedDistanceKm = 18.5;
  if (lot.state && facility.state) {
    if (lot.state.toLowerCase() === facility.state.toLowerCase()) {
      estimatedDistanceKm = 12.0 + (Math.abs(facility.facility_name.length * 3) % 25);
      score += 15;
    } else {
      estimatedDistanceKm = 85.0 + (Math.abs(facility.facility_name.length * 7) % 60);
      score += 0;
    }
  } else {
    estimatedDistanceKm = 22.0;
  }

  const reason = reasonParts.join(', ') + '.';

  return {
    id: facility.id,
    facility_name: facility.facility_name,
    type: facility.type,
    distance_km: parseFloat(estimatedDistanceKm.toFixed(1)),
    cost_per_day: parseFloat(facility.cost_per_day),
    rating: facility.rating || 4.5,
    location: facility.location,
    state: facility.state,
    capacity_kg: facility.capacity_kg,
    score,
    reason,
  };
};

/**
 * GET /api/lots/:id/logistics-suggestion
 */
const getLogisticsSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Lot ID is required' });
    }

    let lot = null;
    try {
      const { data, error } = await supabase.from('produce_lots').select('*').eq('id', id).single();
      if (!error && data) lot = data;
    } catch (err) {
      console.debug(`[logistics lot query] DB note: ${err.message}`);
    }

    if (!lot) {
      lot = MOCK_PRODUCE_LOTS.find((l) => l.id === id) || {
        id,
        crop_type: 'Tomato',
        quantity_kg: 1200,
        grade: 'A',
        state: 'Maharashtra',
      };
    }

    let facilities = [];
    try {
      const { data, error } = await supabase.from('logistics_facilities').select('*');
      if (!error && Array.isArray(data) && data.length > 0) facilities = data;
    } catch (err) {
      console.debug(`[logistics facilities query] DB note: ${err.message}`);
    }

    if (facilities.length === 0) {
      facilities = [...MOCK_LOGISTICS_FACILITIES];
    }

    const scoredFacilities = facilities
      .map((f) => scoreFacility(lot, f))
      .sort((a, b) => b.score - a.score);

    if (scoredFacilities.length === 0) {
      return res.status(200).json({ recommended: null, alternatives: [] });
    }

    const recommended = {
      facility_name: scoredFacilities[0].facility_name,
      type: scoredFacilities[0].type,
      distance_km: scoredFacilities[0].distance_km,
      cost_per_day: scoredFacilities[0].cost_per_day,
      reason: scoredFacilities[0].reason,
    };

    const alternatives = scoredFacilities.slice(1, 4).map((alt) => ({
      facility_name: alt.facility_name,
      type: alt.type,
      distance_km: alt.distance_km,
      cost_per_day: alt.cost_per_day,
      reason: alt.reason,
    }));

    return res.status(200).json({ recommended, alternatives });
  } catch (err) {
    console.error('[getLogisticsSuggestion error]', err);
    return res.status(500).json({ error: `Failed to generate logistics suggestion: ${err.message}` });
  }
};

/**
 * GET /api/logistics/facilities
 */
const getFacilitiesList = async (req, res) => {
  try {
    let facilities = [];
    try {
      const { data, error } = await supabase.from('logistics_facilities').select('*');
      if (!error && Array.isArray(data) && data.length > 0) facilities = data;
    } catch (err) {
      console.debug(`[getFacilitiesList] DB note: ${err.message}`);
    }

    if (facilities.length === 0) {
      facilities = [...MOCK_LOGISTICS_FACILITIES];
    }

    return res.status(200).json(facilities);
  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch facilities: ${err.message}` });
  }
};

/**
 * POST /api/logistics/calculate-roi
 * Financial ROI calculator for cold storage & holding produce
 */
const calculateStorageROI = async (req, res) => {
  try {
    const {
      quantity_kg = 1000,
      holding_days = 5,
      cost_per_day = 300,
      current_price_per_qtl = 2500,
      expected_price_rise_pct = 8,
    } = req.body;

    const totalStorageCost = holding_days * parseFloat(cost_per_day);
    const initialLotValue = (quantity_kg / 100) * parseFloat(current_price_per_qtl);
    const expectedNewPricePerQtl = current_price_per_qtl * (1 + parseFloat(expected_price_rise_pct) / 100);
    const projectedLotValue = (quantity_kg / 100) * expectedNewPricePerQtl;
    const grossPriceGain = projectedLotValue - initialLotValue;
    const netProfitOrLoss = grossPriceGain - totalStorageCost;
    const isProfitable = netProfitOrLoss > 0;

    let recommendation = '';
    if (isProfitable) {
      recommendation = `Storage is economically viable. Net gain after ₹${totalStorageCost.toLocaleString('en-IN')} storage cost is +₹${Math.round(netProfitOrLoss).toLocaleString('en-IN')}.`;
    } else {
      recommendation = `Storage expense (₹${totalStorageCost.toLocaleString('en-IN')}) exceeds projected mandi appreciation (₹${Math.round(grossPriceGain).toLocaleString('en-IN')}). Immediate mandi sale is recommended.`;
    }

    return res.status(200).json({
      quantity_kg: parseFloat(quantity_kg),
      holding_days: parseInt(holding_days, 10),
      total_storage_cost: totalStorageCost,
      initial_lot_value: Math.round(initialLotValue),
      projected_lot_value: Math.round(projectedLotValue),
      gross_price_gain: Math.round(grossPriceGain),
      net_profit_or_loss: Math.round(netProfitOrLoss),
      is_profitable: isProfitable,
      recommendation,
    });
  } catch (err) {
    console.error('[calculateStorageROI error]', err);
    return res.status(500).json({ error: `ROI calculation failed: ${err.message}` });
  }
};

module.exports = {
  getLogisticsSuggestion,
  getFacilitiesList,
  calculateStorageROI,
  scoreFacility,
};
