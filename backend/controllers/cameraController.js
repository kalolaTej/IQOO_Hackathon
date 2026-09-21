const supabase = require('../services/supabaseClient');
const localStore = require('../database/localStore');
const { getLatestPerimeterFrame, processCapture } = require('../services/cameraCaptureService');
const {
  sanitizeCamera,
  validateCameraInput,
  testCameraConnection,
  evaluateCameraHealth,
  recordCameraHeartbeat,
  getCameraLatestFrame,
  cameraHeartbeats,
} = require('../services/cameraService');

/**
 * Receive real-time camera heartbeat from detect.py engine, edge IoT node, or RTSP reader
 */
const updateCameraHeartbeat = async (req, res) => {
  try {
    const { camera_id, status } = req.body;
    if (!camera_id) {
      return res.status(400).json({ success: false, error: 'camera_id is required' });
    }

    if (status === false || status === 'offline') {
      cameraHeartbeats.delete(camera_id);
    } else {
      recordCameraHeartbeat(camera_id);
    }

    return res.status(200).json({
      success: true,
      camera_id,
      status: cameraHeartbeats.has(camera_id) ? 'online' : 'offline',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * List all active cameras with real-time health telemetry & sanitized credentials
 */
const getCameras = async (req, res) => {
  try {
    let cameraList = [];
    const { data: cameras, error: cameraError } = await supabase
      .from('cameras')
      .select('*')
      .order('created_at', { ascending: false });

    if (cameraError || !cameras || cameras.length === 0) {
      cameraList = localStore.find('cameras') || [];
    } else {
      cameraList = cameras;
    }

    // Filter out deleted cameras
    const activeCameras = cameraList.filter((cam) => cam.status !== 'deleted' && !cam.deleted_at);

    const enrichedCameras = activeCameras.map((cam) => {
      const health = evaluateCameraHealth(cam);
      const latestFrame = getCameraLatestFrame(cam.id);

      return sanitizeCamera({
        ...cam,
        status: health.status,
        last_ping: health.lastPing,
        fps: health.isOnline ? (cam.fps || 30) : 0,
        resolution: cam.resolution || '1080p',
        monitoring_enabled: cam.monitoring_enabled !== false,
        detection_enabled: cam.detection_enabled !== false,
        latest_frame: latestFrame ? latestFrame.imageUrl : cam.preview || null,
        lastSeenAt: cam.lastSeenAt || cam.created_at || new Date().toISOString(),
      });
    });

    return res.status(200).json({ success: true, data: enrichedCameras });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Failed to fetch cameras: ${err.message}` });
  }
};

/**
 * Get single camera by ID
 */
const getCameraById = async (req, res) => {
  try {
    const { id } = req.params;
    let camera = null;

    try {
      const { data, error } = await supabase.from('cameras').select('*').eq('id', id).single();
      if (!error && data) camera = data;
    } catch {}

    if (!camera) {
      camera = localStore.findById('cameras', id);
    }

    if (!camera || camera.status === 'deleted' || camera.deleted_at) {
      return res.status(404).json({ success: false, error: 'Camera not found' });
    }

    const health = evaluateCameraHealth(camera);
    const latestFrame = getCameraLatestFrame(camera.id);

    return res.status(200).json({
      success: true,
      data: sanitizeCamera({
        ...camera,
        status: health.status,
        last_ping: health.lastPing,
        latest_frame: latestFrame,
      }),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Add / Register a new IP Camera (validates stream & tests connection before saving)
 */
const createCamera = async (req, res) => {
  try {
    const {
      name,
      ip,
      port,
      source_url,
      camera_type = 'RTSP',
      purpose = 'Perimeter Camera',
      farm_id = '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      field_id = '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      zone = 'North Field - Onion Plot',
      username,
      password,
      status,
      skip_test = false,
    } = req.body;

    // 1. Validate Input Structure
    const validation = validateCameraInput({ name, ip, port, source_url, camera_type });
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    // 2. Perform live connection / stream test if not explicitly skipped
    let testResult = { success: true, status: 'online', previewUrl: '/uploads/detections/sample_wild_boar.jpg' };
    if (!skip_test) {
      testResult = await testCameraConnection({
        ip,
        port,
        source_url,
        camera_type,
        username,
        password,
      });
    }

    const isOnline = status !== undefined
      ? (status === true || status === 'online')
      : (testResult.success && testResult.status === 'online');

    const newCameraData = {
      name: name.trim(),
      ip: ip ? ip.trim() : null,
      port: port ? parseInt(port, 10) : null,
      source_url: source_url ? source_url.trim() : `rtsp://${ip || '192.168.1.105'}:${port || 554}/live`,
      camera_type,
      purpose,
      farm_id,
      field_id,
      zone: zone || 'North Field - Onion Plot',
      username: username || null,
      password: password || null,
      status: isOnline,
      monitoring_enabled: true,
      detection_enabled: true,
      resolution: '1080p',
      fps: isOnline ? 30 : 0,
      preview: testResult.previewUrl || '/uploads/detections/sample_wild_boar.jpg',
      lastSeenAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    let createdCamera = null;
    try {
      const { data, error } = await supabase.from('cameras').insert([newCameraData]).select();
      if (!error && data && data.length > 0) {
        createdCamera = data[0];
      }
    } catch {}

    if (!createdCamera) {
      createdCamera = localStore.insert('cameras', newCameraData);
    }

    if (isOnline) {
      recordCameraHeartbeat(createdCamera.id, {
        imageUrl: newCameraData.preview,
        capturedAt: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      success: true,
      message: isOnline ? 'Camera connected & registered successfully' : 'Camera saved (Connection offline)',
      data: sanitizeCamera({
        ...createdCamera,
        status: isOnline ? 'online' : 'offline',
        last_ping: isOnline ? 'Live now (Stream Connected)' : 'Offline (No response from stream)',
        fps: isOnline ? 30 : 0,
        testResult,
      }),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Failed to create camera: ${err.message}` });
  }
};

/**
 * Edit / Update an existing camera configuration
 */
const updateCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let existing = null;
    try {
      const { data } = await supabase.from('cameras').select('*').eq('id', id).single();
      if (data) existing = data;
    } catch {}
    if (!existing) existing = localStore.findById('cameras', id);

    if (!existing || existing.status === 'deleted') {
      return res.status(404).json({ success: false, error: 'Camera not found' });
    }

    // If IP or stream URL changed, re-validate
    if (updates.source_url || updates.ip) {
      const validation = validateCameraInput({
        name: updates.name || existing.name,
        ip: updates.ip !== undefined ? updates.ip : existing.ip,
        port: updates.port !== undefined ? updates.port : existing.port,
        source_url: updates.source_url !== undefined ? updates.source_url : existing.source_url,
      });
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
      }
    }

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    let updated = null;
    try {
      const { data, error } = await supabase.from('cameras').update(payload).eq('id', id).select();
      if (!error && data && data.length > 0) updated = data[0];
    } catch {}

    if (!updated) {
      updated = localStore.update('cameras', id, payload);
    }

    return res.status(200).json({
      success: true,
      message: 'Camera updated successfully',
      data: sanitizeCamera(updated),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Failed to update camera: ${err.message}` });
  }
};

/**
 * Delete camera safely (soft delete preserves historical detections & siren audits)
 */
const deleteCamera = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove from active heartbeats and in-memory frame cache
    cameraHeartbeats.delete(id);

    // Soft-delete in database
    let deleted = false;
    try {
      const { error } = await supabase.from('cameras').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', id);
      if (!error) deleted = true;
    } catch {}

    if (!deleted) {
      localStore.update('cameras', id, { status: 'deleted', deleted_at: new Date().toISOString() });
    }

    return res.status(200).json({
      success: true,
      message: 'Camera deleted and monitoring released successfully',
      cameraId: id,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Failed to delete camera: ${err.message}` });
  }
};

/**
 * On-demand Test Camera Connection & Frame Retrieval
 */
const testCamera = async (req, res) => {
  try {
    const { id } = req.params;
    let config = req.body;

    // If testing an existing camera by ID
    if (id) {
      let existing = null;
      try {
        const { data } = await supabase.from('cameras').select('*').eq('id', id).single();
        if (data) existing = data;
      } catch {}
      if (!existing) existing = localStore.findById('cameras', id);

      if (existing) {
        config = {
          ip: existing.ip,
          port: existing.port,
          source_url: existing.source_url,
          camera_type: existing.camera_type,
          username: existing.username,
          password: existing.password,
          ...config,
        };
      }
    }

    const testResult = await testCameraConnection(config);
    return res.status(200).json(testResult);
  } catch (err) {
    return res.status(500).json({ success: false, error: `Camera test failed: ${err.message}` });
  }
};

/**
 * Toggle Camera Monitoring ON / OFF
 */
const toggleMonitoring = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const isEnabled = Boolean(enabled);
    const updates = {
      monitoring_enabled: isEnabled,
      detection_enabled: isEnabled,
      status: isEnabled ? true : 'disabled',
      lastSeenAt: new Date().toISOString(),
    };

    if (isEnabled) {
      recordCameraHeartbeat(id);
    } else {
      cameraHeartbeats.delete(id);
    }

    localStore.update('cameras', id, updates);
    try {
      await supabase.from('cameras').update(updates).eq('id', id);
    } catch {}

    return res.status(200).json({
      success: true,
      message: `Monitoring ${isEnabled ? 'enabled' : 'disabled'} for camera ${id}`,
      data: { id, monitoring_enabled: isEnabled, status: isEnabled ? 'online' : 'disabled' },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update Camera Online/Offline Status (Legacy patch endpoint)
 */
const updateCameraStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusBool = status === true || status === 'online';

    if (statusBool) {
      recordCameraHeartbeat(id);
    } else {
      cameraHeartbeats.delete(id);
    }

    localStore.update('cameras', id, { status: statusBool, lastSeenAt: new Date().toISOString() });
    try {
      await supabase.from('cameras').update({ status: statusBool, lastSeenAt: new Date().toISOString() }).eq('id', id);
    } catch {}

    return res.status(200).json({
      success: true,
      data: { id, status: statusBool ? 'online' : 'offline' },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Failed to update camera status: ${err.message}` });
  }
};

/**
 * Get Latest Perimeter Camera Frame
 */
const getPerimeterLatest = async (req, res) => {
  try {
    const latest = getLatestPerimeterFrame();
    return res.status(200).json({
      success: true,
      data: latest,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get Latest Frame for a Specific Camera
 */
const getCameraLatest = async (req, res) => {
  try {
    const { id } = req.params;
    const frame = getCameraLatestFrame(id) || getLatestPerimeterFrame();
    return res.status(200).json({
      success: true,
      data: frame,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Ingest Camera Capture Frame (Manual or IoT Hook)
 */
const captureFrame = async (req, res) => {
  try {
    const { camera_id, field_id, animal, confidence } = req.body;
    const file = req.file;
    const io = req.app.get('io');

    const result = await processCapture({
      cameraId: camera_id || 'cam_01',
      fieldId: field_id || '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      buffer: file ? file.buffer : null,
      originalname: file ? file.originalname : 'manual_capture.jpg',
      forcedAnimal: animal || null,
      forcedConfidence: confidence ? parseFloat(confidence) : null,
      io,
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getCameras,
  getCameraById,
  createCamera,
  updateCamera,
  deleteCamera,
  testCamera,
  toggleMonitoring,
  updateCameraStatus,
  updateCameraHeartbeat,
  getPerimeterLatest,
  getCameraLatest,
  captureFrame,
  liveCameraHeartbeats: cameraHeartbeats,
};
