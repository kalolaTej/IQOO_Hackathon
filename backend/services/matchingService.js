// ============================================================================
// Phase 6: Matching Service
// 
// Pure, deterministic rule engine for buyer matching.
// Extracted from matchingController to prevent controller-to-controller coupling.
// ============================================================================

exports.calculateMatchScore = (lot, demandProfile) => {
  let score = 0;
  const reasons = {};

  // 1. Crop Match (+40)
  if (lot.crop_type.toLowerCase().trim() === demandProfile.crop_type.toLowerCase().trim()) {
    score += 40;
    reasons.crop = 'matched';
  } else {
    reasons.crop = 'mismatch';
    // Fast fail if crop doesn't match
    return { score: 0, reasons };
  }

  // 2. Quantity Compatibility (+25)
  // If lot quantity is strictly within min/max, 25 points. 
  const qty = Number(lot.quantity_kg);
  const min = demandProfile.min_quantity_kg ? Number(demandProfile.min_quantity_kg) : 0;
  const max = demandProfile.max_quantity_kg ? Number(demandProfile.max_quantity_kg) : Infinity;
  
  if (qty >= min && qty <= max) {
    score += 25;
    reasons.quantity = 'within buyer range';
  } else {
    reasons.quantity = 'outside buyer range';
  }

  // 3. Location Compatibility (+20)
  const lotLoc = lot.farms?.location || '';
  const prefLoc = demandProfile.preferred_location || '';
  if (prefLoc && lotLoc.toLowerCase().includes(prefLoc.toLowerCase())) {
    score += 20;
    reasons.location = 'preferred location matched';
  } else {
    reasons.location = 'location mismatch';
  }

  // 4. Quality Grade Compatibility (+15)
  if (!lot.grade) {
    reasons.quality = 'grading pending';
  } else if (lot.grade === demandProfile.quality_grade || lot.grade === 'A') {
    score += 15;
    reasons.quality = `grade ${lot.grade} accepted`;
  } else {
    reasons.quality = 'grade mismatch';
  }

  return { score, reasons };
};
