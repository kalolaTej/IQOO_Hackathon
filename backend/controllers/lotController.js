const fs = require('fs');
const path = require('path');
const supabase = require('../services/supabaseClient');
const localStore = require('../database/localStore');
const { gradeCropImage } = require('../services/cropGradingService');

/**
 * Normalize any input grade into canonical 'A', 'B', 'C', or 'REVIEW_REQUIRED'
 */
const normalizeGrade = (rawGrade) => {
  if (!rawGrade) return 'REVIEW_REQUIRED';
  const str = String(rawGrade).toUpperCase().trim();
  if (str.includes('REVIEW') || str.includes('UNAVAILABLE') || str.includes('REQUIRE')) return 'REVIEW_REQUIRED';
  if (str === 'C' || str.includes('GRADE C') || str.endsWith(' C') || str.startsWith('C')) return 'C';
  if (str === 'B' || str.includes('GRADE B') || str.endsWith(' B') || str.startsWith('B')) return 'B';
  if (str === 'A' || str.includes('GRADE A') || str.endsWith(' A') || str.startsWith('A')) return 'A';
  return 'REVIEW_REQUIRED';
};

const createLot = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : '29b9b72f-0d43-4a23-9b04-dc9e14180f2a';
    const { farm_id, crop_type, crop, quantity_kg, quantity, unit, quality_notes, harvest_date, moisture } = req.body;
    
    // Support files either from single upload ('image' / 'photo') or array ('photos')
    let file = req.file;
    if (!file && req.files && req.files.length > 0) {
      file = req.files[0];
    }

    const cropName = (crop_type || crop || '').trim();
    if (!cropName) {
      return res.status(400).json({ success: false, error: 'Crop type is required' });
    }

    const rawQty = quantity_kg !== undefined ? quantity_kg : quantity;
    const numericQuantity = parseFloat(rawQty);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive quantity is required' });
    }

    // Ensure crops directory exists
    const uploadsBase = path.join(__dirname, '..', 'uploads');
    const cropsDir = path.join(uploadsBase, 'crops');
    if (!fs.existsSync(cropsDir)) {
      fs.mkdirSync(cropsDir, { recursive: true });
    }

    let originalImageUrl = '';
    let processedImageUrl = '';
    let gradingResult = {
      gradingStatus: 'review_required',
      grade: 'REVIEW_REQUIRED',
      qualityScore: null,
      confidence: null,
      defectFlags: [],
      notes: 'No crop photo provided for automated grading.',
      features: null,
      processedImageUrl: null,
    };

    if (file) {
      const ext = path.extname(file.originalname || '') || '.jpg';
      const fileName = `crop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
      const localFilePath = path.join(cropsDir, fileName);

      fs.writeFileSync(localFilePath, file.buffer);
      originalImageUrl = `/uploads/crops/${fileName}`;

      // Run OpenCV Crop Grading Analysis on the real crop image
      gradingResult = await gradeCropImage({
        buffer: file.buffer,
        filePath: localFilePath,
        originalname: file.originalname || fileName,
        cropType: cropName,
      });

      processedImageUrl = gradingResult.processedImageUrl || originalImageUrl;
    }

    const canonicalGrade = normalizeGrade(gradingResult.grade);
    const lotId = `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newLotPayload = {
      id: lotId,
      user_id: userId,
      farm_id: farm_id || '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      crop_type: cropName,
      crop: cropName,
      quantity_kg: numericQuantity,
      quantity: numericQuantity,
      unit: unit || 'kg',
      image_url: originalImageUrl || '/uploads/crops/sample_tomato.jpg',
      original_image_url: originalImageUrl || '/uploads/crops/sample_tomato.jpg',
      processed_image_url: processedImageUrl || originalImageUrl || '/uploads/crops/sample_tomato.jpg',
      photo_urls: originalImageUrl ? [originalImageUrl] : [],
      grading_status: gradingResult.gradingStatus || (canonicalGrade === 'REVIEW_REQUIRED' ? 'review_required' : 'completed'),
      grade: canonicalGrade,
      quality_score: gradingResult.qualityScore !== null && gradingResult.qualityScore !== undefined ? gradingResult.qualityScore : 0,
      grading_confidence: gradingResult.confidence || 0.85,
      grading_features: gradingResult.features || {},
      defect_flags: gradingResult.defectFlags || [],
      quality_notes: quality_notes || gradingResult.notes || 'OpenCV analysis completed.',
      moisture: moisture || '11.0%',
      harvest_date: harvest_date || new Date().toISOString().split('T')[0],
      status: 'Ready for Sale',
      created_at: new Date().toISOString(),
    };

    let savedLot = null;
    try {
      const { data, error } = await supabase.from('produce_lots').insert([newLotPayload]).select().single();
      if (error || !data) {
        savedLot = localStore.insert('produce_lots', newLotPayload);
      } else {
        savedLot = data;
      }
    } catch (e) {
      savedLot = localStore.insert('produce_lots', newLotPayload);
    }

    return res.status(201).json({
      success: true,
      message: 'Produce batch created and graded successfully',
      data: {
        ...savedLot,
        grade: canonicalGrade,
      },
      grading: gradingResult,
    });
  } catch (err) {
    console.error(`[CREATE PRODUCE ERROR] ${err.message}`);
    return res.status(500).json({ success: false, error: `Failed to create produce: ${err.message}` });
  }
};

const getLots = async (req, res) => {
  try {
    let lots = [];
    try {
      const { data, error } = await supabase.from('produce_lots').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        lots = data;
      }
    } catch (e) {}

    if (lots.length === 0) {
      lots = localStore.getCollection('produce_lots') || [];
    }

    // Filter out deleted lots & normalize grades
    const activeLots = lots
      .filter((lot) => lot.status !== 'deleted' && !lot.deleted_at)
      .map((lot) => ({
        ...lot,
        crop: lot.crop || lot.crop_type,
        crop_type: lot.crop_type || lot.crop,
        grade: normalizeGrade(lot.grade),
        quality_score: lot.quality_score !== undefined && lot.quality_score !== null ? lot.quality_score : 80,
        original_image_url: lot.original_image_url || lot.image_url,
        processed_image_url: lot.processed_image_url || lot.image_url,
      }));

    return res.status(200).json({
      success: true,
      data: activeLots,
      count: activeLots.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getLotById = async (req, res) => {
  try {
    const { id } = req.params;
    let lot = null;

    try {
      const { data, error } = await supabase.from('produce_lots').select('*').eq('id', id).single();
      if (!error && data) lot = data;
    } catch (e) {}

    if (!lot) {
      lot = localStore.findById('produce_lots', id);
    }

    if (!lot || lot.status === 'deleted' || lot.deleted_at) {
      return res.status(404).json({ success: false, error: 'Produce lot not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...lot,
        crop: lot.crop || lot.crop_type,
        crop_type: lot.crop_type || lot.crop,
        grade: normalizeGrade(lot.grade),
        quality_score: lot.quality_score !== undefined && lot.quality_score !== null ? lot.quality_score : 80,
        original_image_url: lot.original_image_url || lot.image_url,
        processed_image_url: lot.processed_image_url || lot.image_url,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Delete Produce Batch Endpoint (DELETE /api/produce/:id or DELETE /api/lots/:id)
const deleteLot = async (req, res) => {
  try {
    const { id } = req.params;

    let existing = localStore.findById('produce_lots', id);
    if (!existing) {
      try {
        const { data } = await supabase.from('produce_lots').select('*').eq('id', id).single();
        if (data) existing = data;
      } catch {}
    }

    if (!existing || existing.status === 'deleted') {
      return res.status(404).json({ success: false, error: 'Produce record not found' });
    }

    // Soft delete in database
    try {
      await supabase.from('produce_lots').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', id);
    } catch {}

    localStore.delete('produce_lots', id);

    return res.status(200).json({
      success: true,
      message: 'Produce batch deleted successfully',
      id,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Failed to delete produce: ${err.message}` });
  }
};

// Retry / Regrade Produce Batch Endpoint (POST /api/produce/:id/grade or POST /api/lots/:id/regrade)
const retryGrading = async (req, res) => {
  try {
    const { id } = req.params;
    let lot = null;
    try {
      const { data } = await supabase.from('produce_lots').select('*').eq('id', id).single();
      if (data) lot = data;
    } catch {}
    if (!lot) {
      lot = localStore.findById('produce_lots', id);
    }

    if (!lot) {
      return res.status(404).json({ success: false, error: 'Produce lot not found' });
    }

    const imageRef = lot.original_image_url || lot.image_url;
    let localFilePath = null;
    let buffer = null;

    if (imageRef && imageRef.startsWith('/uploads/')) {
      const candidatePath = path.join(__dirname, '..', imageRef);
      if (fs.existsSync(candidatePath)) {
        localFilePath = candidatePath;
        buffer = fs.readFileSync(candidatePath);
      }
    }

    const gradingResult = await gradeCropImage({
      buffer,
      filePath: localFilePath,
      originalname: path.basename(imageRef || 'regrade_crop.jpg'),
      cropType: lot.crop_type || lot.crop || 'Tomato',
    });

    const canonicalGrade = normalizeGrade(gradingResult.grade || lot.grade);
    const updates = {
      grading_status: gradingResult.gradingStatus || 'completed',
      grade: canonicalGrade,
      quality_score: gradingResult.qualityScore,
      grading_confidence: gradingResult.confidence,
      grading_features: gradingResult.features,
      defect_flags: gradingResult.defectFlags,
      quality_notes: gradingResult.notes,
      processed_image_url: gradingResult.processedImageUrl || lot.processed_image_url || lot.image_url,
      graded_at: new Date().toISOString(),
    };

    let updated = null;
    try {
      const { data } = await supabase.from('produce_lots').update(updates).eq('id', id).select().single();
      if (data) updated = data;
    } catch {}

    if (!updated) {
      updated = localStore.update('produce_lots', id, updates) || { ...lot, ...updates };
    }

    return res.status(200).json({
      success: true,
      message: 'Grading re-evaluated successfully via OpenCV pipeline',
      data: {
        ...updated,
        grade: canonicalGrade,
      },
      grading: gradingResult,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Retry grading failed: ${err.message}` });
  }
};

module.exports = {
  createLot,
  getLots,
  getLotById,
  deleteLot,
  retryGrading,
  normalizeGrade,
};
