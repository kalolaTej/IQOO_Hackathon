/**
 * AgriSync - Crop Grading & OpenCV Quality Analysis Service
 * 
 * Features:
 *  - Deterministic OpenCV Produce Quality Pipeline executed via Python CLI runner or FastAPI service
 *  - Strict Defect Dominance: Rotten/damaged produce is guaranteed Grade C / Grade B, never Grade A
 *  - Generates HUD-annotated Defect Mask & Overlay Image saved to /uploads/crops/annotated_<filename>.jpg
 *  - Explainable features: defectRatio, defectCount, maxSingleDefectPct, colorScore, shapeScore, uniformityScore
 *  - Quality gate: Blurry or underexposed images return REVIEW_REQUIRED
 *  - Supports full retry grading on stored crop images
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const GRADING_SERVICE_URL = process.env.GRADING_SERVICE_URL || 'http://127.0.0.1:8001';
const CLI_PATH = path.join(__dirname, '..', '..', 'grading-service', 'grade_cli.py');

/**
 * Execute Python OpenCV Grading CLI
 * @param {string} imagePath - Absolute path to the source image
 * @param {string} cropType - Crop name (e.g., "Tomato", "Onion")
 * @param {string} annotatedPath - Destination path for annotated defect image
 * @returns {Promise<Object>}
 */
const runGradingCLI = (imagePath, cropType, annotatedPath) => {
  return new Promise((resolve, reject) => {
    const pythonExecutable = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
    execFile(
      pythonExecutable,
      [CLI_PATH, imagePath, cropType || 'General', annotatedPath],
      { timeout: 15000 },
      (error, stdout, stderr) => {
        if (error) {
          console.warn(`[OPENCV CLI ERROR] ${error.message}. stderr: ${stderr}`);
          return reject(error);
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch (e) {
          console.error(`[OPENCV CLI PARSE ERROR] Invalid JSON: ${stdout}`);
          reject(e);
        }
      }
    );
  });
};

/**
 * Grade an uploaded crop image using OpenCV pipeline
 * @param {Object} options
 * @param {Buffer} [options.buffer] - Image buffer
 * @param {string} [options.originalname] - Original file name
 * @param {string} [options.filePath] - Direct path to saved image file
 * @param {string} [options.cropType] - Crop name (e.g. "Tomato", "Red Onion")
 * @returns {Promise<Object>} Grading result
 */
const gradeCropImage = async ({ buffer, originalname = 'crop.jpg', filePath, cropType = 'Tomato' }) => {
  const uploadsCropsDir = path.join(__dirname, '..', 'uploads', 'crops');
  if (!fs.existsSync(uploadsCropsDir)) {
    fs.mkdirSync(uploadsCropsDir, { recursive: true });
  }

  let sourceFilePath = filePath;
  let tempCreated = false;

  // If direct filePath is not provided, write buffer to disk
  if (!sourceFilePath || !fs.existsSync(sourceFilePath)) {
    if (!buffer || buffer.length === 0) {
      return {
        gradingStatus: 'review_required',
        grade: 'REVIEW_REQUIRED',
        qualityScore: 0,
        confidence: 0.30,
        defectFlags: ['no_image_data'],
        notes: 'No valid image data provided for quality grading.',
        features: null,
        processedImageUrl: null,
        gradedAt: new Date().toISOString(),
      };
    }

    const ext = path.extname(originalname) || '.jpg';
    const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    sourceFilePath = path.join(uploadsCropsDir, tempFileName);
    fs.writeFileSync(sourceFilePath, buffer);
    tempCreated = true;
  }

  // Derive annotated image destination filename
  const baseName = path.basename(sourceFilePath);
  const annotatedFileName = `annotated_${baseName}`;
  const annotatedFilePath = path.join(uploadsCropsDir, annotatedFileName);
  const processedImageUrl = `/uploads/crops/${annotatedFileName}`;

  try {
    // 1. Run Python OpenCV CLI runner
    const cliResult = await runGradingCLI(sourceFilePath, cropType, annotatedFilePath);

    if (cliResult.success) {
      console.log(`[OPENCV GRADING] Success: Grade ${cliResult.grade} for ${cropType} (Defect %: ${(cliResult.features?.defectRatio * 100 || 0).toFixed(1)}%)`);

      const hasAnnotated = fs.existsSync(annotatedFilePath);

      return {
        gradingStatus: cliResult.grading_status || 'completed',
        grade: cliResult.grade,
        qualityScore: cliResult.quality_score,
        confidence: cliResult.confidence,
        defectFlags: cliResult.defect_flags || [],
        notes: cliResult.notes || `OpenCV analysis complete: Grade ${cliResult.grade} assigned.`,
        features: cliResult.features || {},
        analysis: cliResult.analysis || {},
        processedImageUrl: hasAnnotated ? processedImageUrl : null,
        gradedAt: new Date().toISOString(),
        source: 'OpenCV Classical Vision',
      };
    } else {
      console.warn(`[OPENCV GRADING] Processing error: ${cliResult.error}`);
      return {
        gradingStatus: 'review_required',
        grade: 'REVIEW_REQUIRED',
        qualityScore: 0,
        confidence: 0.35,
        defectFlags: ['analysis_error'],
        notes: cliResult.error || 'OpenCV analysis could not confidently evaluate the image.',
        features: null,
        processedImageUrl: null,
        gradedAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error(`[OPENCV GRADING FAILED] ${err.message}`);
    return {
      gradingStatus: 'review_required',
      grade: 'REVIEW_REQUIRED',
      qualityScore: 0,
      confidence: 0.30,
      defectFlags: ['pipeline_exception'],
      notes: 'OpenCV quality grading encountered an exception. Manual review required.',
      features: null,
      processedImageUrl: null,
      gradedAt: new Date().toISOString(),
    };
  }
};

module.exports = {
  gradeCropImage,
};
