/**
 * AgriSync - 30-Second Automatic Camera Capture & Field Pipeline Service
 * Features:
 *  - Automated 30-second field camera capture scheduler
 *  - Supports multi-camera rotation and dynamic camera registration
 *  - Receives, stores, and logs every capture in database (field_captures)
 *  - Coordinates AI detection inference
 *  - If animal detected -> persists detection event, auto-triggers siren (with cooldown), broadcasts alert
 *  - If no animal -> updates latestPerimeterImage, updates live camera feed, broadcasts normal status
 *  - Resilient offline and network failure handling with automatic retry
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');
const localStore = require('../database/localStore');
const supabase = require('./supabaseClient');
const { analyzeImageForAnimals } = require('./detectionService');
const { triggerSiren } = require('./sirenService');
const { setCameraLatestFrame, recordCameraHeartbeat } = require('./cameraService');

let captureIntervalId = null;
let latestPerimeterFrame = {
  cameraId: 'cam_01',
  cameraName: 'North Perimeter Cam',
  zone: 'North Field - Onion Plot',
  imageUrl: '/uploads/detections/sample_wild_boar.jpg',
  capturedAt: new Date().toISOString(),
  detectionStatus: 'no_animal',
  status: 'online',
  fps: 30,
};

/**
 * Fetch a single live snapshot buffer from an HTTP / IP Webcam camera
 */
const fetchLiveSnapshotBuffer = (sourceUrl) => {
  return new Promise((resolve) => {
    if (!sourceUrl || !sourceUrl.startsWith('http')) {
      return resolve(null);
    }

    let targetUrl = sourceUrl;
    // Android IP Webcam standard snapshot endpoints
    if (targetUrl.includes('/video')) {
      targetUrl = targetUrl.replace('/video', '/shot.jpg');
    } else if (!targetUrl.includes('.jpg') && !targetUrl.includes('.jpeg')) {
      targetUrl = targetUrl.replace(/\/+$/, '') + '/shot.jpg';
    }

    try {
      const parsed = url.parse(targetUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(targetUrl, { timeout: 2500 }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer.length > 1000 ? buffer : null);
          });
        } else {
          resolve(null);
        }
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
};

/**
 * Ingest and process a single camera frame through the complete pipeline
 */
const processCapture = async ({
  cameraId = 'cam_01',
  fieldId = '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
  buffer = null,
  originalname = 'field_frame.jpg',
  imageUrl = null,
  forcedAnimal = null,
  forcedConfidence = null,
  io = null,
}) => {
  const capturedAt = new Date().toISOString();
  console.log(`[CAMERA] Capture received from Camera: ${cameraId} at ${capturedAt}`);

  // Fetch camera name & zone if available
  let cameraRecord = localStore.findById('cameras', cameraId);
  const cameraName = cameraRecord?.name || 'Perimeter Camera';
  const zoneName = cameraRecord?.zone || 'North Field - Onion Plot';
  const effectiveFieldId = cameraRecord?.field_id || fieldId;

  try {
    // If no buffer provided but camera has a live HTTP source, attempt to fetch real snapshot
    let activeBuffer = buffer;
    if (!activeBuffer && cameraRecord?.source_url && cameraRecord.source_url.startsWith('http')) {
      activeBuffer = await fetchLiveSnapshotBuffer(cameraRecord.source_url);
    }

    // 1. Run AI Animal Detection Analysis
    const analysis = await analyzeImageForAnimals({
      buffer: activeBuffer,
      originalname,
      cameraId,
      forcedAnimal,
      forcedConfidence,
    });

    const finalImageUrl = (activeBuffer && analysis.rawImageUrl)
      ? analysis.rawImageUrl
      : (imageUrl || (cameraRecord?.source_url && cameraRecord.source_url.startsWith('http') ? cameraRecord.source_url : analysis.rawImageUrl));

    const isAnimalDetected = analysis.animalDetected;

    // 2. Persist FieldCapture in Database
    const capturePayload = {
      camera_id: cameraId,
      camera_name: cameraName,
      field_id: effectiveFieldId,
      image_url: finalImageUrl,
      captured_at: capturedAt,
      processed_at: analysis.processedAt,
      detection_status: analysis.detectionStatus,
      animal_detected: isAnimalDetected,
      detected_animal: analysis.animalType,
      confidence: analysis.confidence,
      bounding_boxes: analysis.boundingBoxes,
      detection_image_url: analysis.processedImageUrl,
    };

    let savedCapture = null;
    try {
      const { data: dbCap, error: dbErr } = await supabase.from('field_captures').insert([capturePayload]).select();
      if (dbErr || !dbCap) {
        savedCapture = localStore.insert('field_captures', capturePayload);
      } else {
        savedCapture = dbCap[0];
      }
    } catch (e) {
      savedCapture = localStore.insert('field_captures', capturePayload);
    }

    // Update camera heartbeat & per-camera latest frame
    recordCameraHeartbeat(cameraId, {
      cameraId,
      cameraName,
      imageUrl: finalImageUrl,
      detectionStatus: analysis.detectionStatus,
      animal: analysis.animalType,
      confidence: analysis.confidence,
      capturedAt,
    });

    // 3. Handle Branch: ANIMAL DETECTED vs NO ANIMAL
    if (isAnimalDetected) {
      console.log(`[AI] Animal Intrusion Detected: ${analysis.animalType} (${analysis.confidence}%) on Camera: ${cameraId} (${cameraName})`);

      // Save Detection Event
      const detectionPayload = {
        field_capture_id: savedCapture ? savedCapture.id : null,
        camera_id: cameraId,
        camera_name: cameraName,
        field_id: effectiveFieldId,
        animal: analysis.animalType,
        confidence: analysis.confidence,
        image_url: finalImageUrl,
        processed_image_url: analysis.processedImageUrl,
        bounding_boxes: analysis.boundingBoxes,
        detected_at: capturedAt,
        status: 'Active Alert',
      };

      let savedDetection = null;
      try {
        const { data: dbDet, error: detErr } = await supabase.from('detections').insert([detectionPayload]).select();
        if (detErr || !dbDet) {
          savedDetection = localStore.insert('detections', detectionPayload);
        } else {
          savedDetection = dbDet[0];
        }
      } catch (e) {
        savedDetection = localStore.insert('detections', detectionPayload);
      }

      // Automatically Trigger Deterrent Siren (with 30s cooldown protection)
      const sirenResult = await triggerSiren({
        detectionEventId: savedDetection ? savedDetection.id : null,
        deviceId: 'ESP32-DETERRENT-01',
        animal: analysis.animalType,
        confidence: analysis.confidence,
        fieldId: effectiveFieldId,
        cameraId,
        io,
      });

      // Update latest frame state
      latestPerimeterFrame = {
        cameraId,
        cameraName,
        zone: zoneName,
        imageUrl: analysis.processedImageUrl || finalImageUrl,
        capturedAt,
        detectionStatus: 'animal_detected',
        animal: analysis.animalType,
        confidence: analysis.confidence,
        status: 'online',
        fps: 30,
      };

      setCameraLatestFrame(cameraId, latestPerimeterFrame);

      // Broadcast real-time update
      if (io) {
        io.emit('new-detection', savedDetection);
        io.emit('perimeter-updated', latestPerimeterFrame);
      }

      return {
        success: true,
        detectionStatus: 'animal_detected',
        capture: savedCapture,
        detection: savedDetection,
        siren: sirenResult,
      };
    } else {
      // NO ANIMAL DETECTED
      console.log(`[AI] Field frame analyzed from Camera ${cameraId}: Normal live stream active.`);

      latestPerimeterFrame = {
        cameraId,
        cameraName,
        zone: zoneName,
        imageUrl: finalImageUrl,
        capturedAt,
        detectionStatus: 'no_animal',
        animal: null,
        confidence: 0,
        status: 'online',
        fps: 30,
      };

      setCameraLatestFrame(cameraId, latestPerimeterFrame);

      if (io) {
        io.emit('perimeter-updated', latestPerimeterFrame);
      }

      return {
        success: true,
        detectionStatus: 'no_animal',
        capture: savedCapture,
        latestPerimeter: latestPerimeterFrame,
      };
    }
  } catch (err) {
    console.error(`[CAMERA ERROR] Capture processing failed: ${err.message}`);
    return {
      success: false,
      error: err.message,
      detectionStatus: 'error',
    };
  }
};

/**
 * Start the Automatic Camera Capture Scheduler
 */
const startCaptureScheduler = (app) => {
  if (captureIntervalId) {
    clearInterval(captureIntervalId);
  }

  console.log('[CAMERA SCHEDULER] Field Camera capture pipeline active.');

  // Schedule every 30 seconds
  captureIntervalId = setInterval(() => {
    runScheduledCycle(app);
  }, 30000);
};

const runScheduledCycle = async (app) => {
  const io = app ? app.get('io') : null;

  // Find active cameras
  const activeCameras = (localStore.find('cameras') || []).filter(
    (c) => c.status !== 'deleted' && !c.deleted_at && c.monitoring_enabled !== false
  );

  if (activeCameras.length === 0) return;

  for (const cam of activeCameras) {
    // If camera is an active HTTP live stream, fetch live snapshot buffer
    if (cam.source_url && cam.source_url.startsWith('http')) {
      const buffer = await fetchLiveSnapshotBuffer(cam.source_url);
      if (buffer) {
        await processCapture({
          cameraId: cam.id,
          fieldId: cam.field_id || '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
          buffer,
          originalname: `live_${cam.id}.jpg`,
          io,
        });
      }
    }
  }
};

const stopCaptureScheduler = () => {
  if (captureIntervalId) {
    clearInterval(captureIntervalId);
    captureIntervalId = null;
  }
};

const getLatestPerimeterFrame = () => {
  return latestPerimeterFrame;
};

module.exports = {
  fetchLiveSnapshotBuffer,
  processCapture,
  startCaptureScheduler,
  stopCaptureScheduler,
  getLatestPerimeterFrame,
};
