const express = require('express');
const multer = require('multer');
const {
  createDetection,
  getDetections,
  getDetectionById,
  getFieldCaptures,
  getSirenCurrentStatus,
  triggerSirenManual,
} = require('../controllers/detectionController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

// Edge AI & Camera Intake
router.post('/detection', upload.single('image'), createDetection);
router.post('/detections', upload.single('image'), createDetection);

// Detection Logs & Field Captures
router.get('/detections', getDetections);
router.get('/detections/:id', getDetectionById);
router.get('/field-captures', getFieldCaptures);

// Siren Controls & Status
router.get('/siren/status', getSirenCurrentStatus);
router.post('/siren/trigger', triggerSirenManual);

module.exports = router;
