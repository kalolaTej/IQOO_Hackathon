const supabase = require('../services/supabaseClient');
const localStore = require('../database/localStore');
const { processCapture } = require('../services/cameraCaptureService');
const { triggerSiren, getSirenState } = require('../services/sirenService');
const { sendDetectionPush } = require('../services/firebase');
const { getSystemSettings } = require('./settingsController');

/**
 * POST /api/detection (Unauthenticated edge camera / YOLO intake)
 */
const createDetection = async (req, res) => {
  try {
    const { camera_id, zone, animal, confidence, time, field_id } = req.body;
    const file = req.file;
    const io = req.app.get('io');

    if (!camera_id || (!animal && !file)) {
      return res.status(400).json({
        error: 'missing required detection fields (camera_id, animal or image file)',
      });
    }

    const result = await processCapture({
      cameraId: camera_id,
      fieldId: field_id || '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      buffer: file ? file.buffer : null,
      originalname: file ? file.originalname : `${animal || 'detection'}.jpg`,
      forcedAnimal: animal || null,
      forcedConfidence: confidence !== undefined ? parseFloat(confidence) : null,
      io,
    });

    return res.status(201).json({
      success: true,
      detection: result.detection || result.capture,
      siren: result.siren || null,
    });
  } catch (err) {
    console.error(`[DETECTION ERROR] ${err.message}`);
    return res.status(500).json({ error: `detection ingestion error: ${err.message}` });
  }
};

/**
 * GET /api/detections
 */
const getDetections = async (req, res) => {
  try {
    const { camera_id, camera, animal, min_confidence, limit: queryLimit, page: queryPage, offset: queryOffset } = req.query;

    const limit = parseInt(queryLimit, 10) > 0 ? Math.min(parseInt(queryLimit, 10), 100) : 20;
    let page = 1;
    if (queryPage) {
      page = parseInt(queryPage, 10) > 0 ? parseInt(queryPage, 10) : 1;
    } else if (queryOffset) {
      page = Math.floor(parseInt(queryOffset, 10) / limit) + 1;
    }
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let items = localStore.find('detections') || [];

    const targetCamera = camera_id || camera;
    if (targetCamera && targetCamera !== 'All') {
      items = items.filter((d) => d.camera_id === targetCamera);
    }

    if (animal && animal !== 'All') {
      items = items.filter((d) => (d.animal || '').toLowerCase().includes(animal.toLowerCase()));
    }

    const minConf = parseFloat(min_confidence);
    if (!isNaN(minConf) && minConf > 0) {
      items = items.filter((d) => (d.confidence || 0) >= minConf);
    }

    const total = items.length;
    const paginated = items.slice(from, to + 1);

    return res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: `failed to fetch detections: ${err.message}` });
  }
};

/**
 * GET /api/detections/:id
 */
const getDetectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = localStore.findById('detections', id);
    if (item) {
      return res.status(200).json({ success: true, data: item });
    }
    return res.status(404).json({ error: 'detection not found' });
  } catch (err) {
    return res.status(500).json({ error: `failed to fetch detection: ${err.message}` });
  }
};

/**
 * GET /api/field-captures
 */
const getFieldCaptures = async (req, res) => {
  try {
    const captures = localStore.find('field_captures') || [];
    return res.status(200).json({
      success: true,
      data: captures.slice(0, 50),
      total: captures.length,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/siren/status
 */
const getSirenCurrentStatus = (req, res) => {
  return res.status(200).json({
    success: true,
    data: getSirenState(),
  });
};

/**
 * POST /api/siren/trigger
 */
const triggerSirenManual = async (req, res) => {
  try {
    const { animal, duration_ms, force } = req.body;
    const io = req.app.get('io');
    const result = await triggerSiren({
      animal: animal || 'wild_boar',
      confidence: 95,
      durationMs: duration_ms || 5000,
      force: Boolean(force),
      io,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/detections (Clear all detection logs)
 */
const clearAllDetections = async (req, res) => {
  try {
    const io = req.app.get('io');

    // 1. Clear Supabase tables if configured
    try {
      if (supabase && typeof supabase.from === 'function') {
        await supabase
          .from('detections')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        await supabase
          .from('field_captures')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
      }
    } catch (dbErr) {
      console.warn('[clearAllDetections] Supabase clear warning:', dbErr.message);
    }

    // 2. Clear local store
    localStore.clear('detections');
    localStore.clear('field_captures');

    // 3. Broadcast real-time update to web clients
    if (io) {
      io.emit('detections_cleared', { timestamp: new Date().toISOString() });
      io.emit('detection_update', []);
    }

    return res.status(200).json({
      success: true,
      message: 'All detection logs and field captures successfully cleared.',
    });
  } catch (err) {
    console.error('[clearAllDetections error]:', err);
    return res.status(500).json({ error: `Failed to clear detections: ${err.message}` });
  }
};

/**
 * DELETE /api/detections/:id (Delete single detection log)
 */
const deleteDetectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get('io');

    // 1. Delete from Supabase if configured
    try {
      if (supabase && typeof supabase.from === 'function') {
        await supabase
          .from('detections')
          .delete()
          .eq('id', id);
      }
    } catch (dbErr) {
      console.warn('[deleteDetectionById] Supabase delete warning:', dbErr.message);
    }

    // 2. Delete from local store
    const deleted = localStore.delete('detections', id);

    // 3. Broadcast socket event
    if (io) {
      io.emit('detection_deleted', { id });
    }

    return res.status(200).json({
      success: true,
      deleted,
      message: `Detection ${id} deleted successfully.`,
    });
  } catch (err) {
    console.error('[deleteDetectionById error]:', err);
    return res.status(500).json({ error: `Failed to delete detection: ${err.message}` });
  }
};

module.exports = {
  createDetection,
  getDetections,
  getDetectionById,
  getFieldCaptures,
  getSirenCurrentStatus,
  triggerSirenManual,
  clearAllDetections,
  deleteDetectionById,
};
