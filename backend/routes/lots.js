const express = require('express');
const multer = require('multer');
const {
  createLot,
  getLots,
  getLotById,
  deleteLot,
  retryGrading,
} = require('../controllers/lotController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const router = express.Router();

// Produce creation with crop photo upload
router.post('/lots', upload.single('image'), createLot);
router.post('/produce', upload.single('image'), createLot);

// Produce listing & detail
router.get('/lots', getLots);
router.get('/produce', getLots);
router.get('/lots/:id', getLotById);
router.get('/produce/:id', getLotById);

// Produce deletion
router.delete('/lots/:id', deleteLot);
router.delete('/produce/:id', deleteLot);

// Retry grading endpoint
router.post('/lots/:id/grade', retryGrading);
router.post('/produce/:id/grade', retryGrading);
router.post('/produce/:id/grade/retry', retryGrading);

module.exports = router;
