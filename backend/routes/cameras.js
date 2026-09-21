const express = require('express');
const multer = require('multer');
const {
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
} = require('../controllers/cameraController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

// Camera CRUD & Management
router.get('/cameras', getCameras);
router.get('/cameras/:id', getCameraById);
router.post('/cameras', createCamera);
router.put('/cameras/:id', updateCamera);
router.patch('/cameras/:id', updateCamera);
router.delete('/cameras/:id', deleteCamera);

// Camera Connection Testing & Heartbeat
router.post('/cameras/test', testCamera);
router.post('/cameras/:id/test', testCamera);
router.post('/cameras/heartbeat', updateCameraHeartbeat);

// Status & Monitoring Toggles
router.patch('/cameras/:id/monitoring', toggleMonitoring);
router.patch('/cameras/:id/status', updateCameraStatus);

// Stream & Frame Telemetry
router.get('/cameras/:id/latest-frame', getCameraLatest);
router.get('/camera/perimeter-latest', getPerimeterLatest);
router.get('/cameras/perimeter-latest', getPerimeterLatest);

// Manual / IoT Frame Ingest
router.post('/camera/capture', upload.single('image'), captureFrame);
router.post('/cameras/capture', upload.single('image'), captureFrame);

module.exports = router;
