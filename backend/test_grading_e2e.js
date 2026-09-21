const fs = require('fs');
const path = require('path');
const { gradeCropImage } = require('./services/cropGradingService');

async function runE2ETest() {
  console.log('===============================================================');
  console.log('       AgriSync OpenCV Crop Grading End-to-End Test           ');
  console.log('===============================================================');

  const testDir = path.join(__dirname, '..', 'grading-service', 'test_images');
  
  const testFiles = [
    { file: 'tomato_healthy_white_bg.jpg', crop: 'Tomato', expGrade: 'A' },
    { file: 'tomato_minor_spots.jpg', crop: 'Tomato', expGrade: 'B' },
    { file: 'tomato_large_rot.jpg', crop: 'Tomato', expGrade: 'C' },
    { file: 'tomato_severe_multiple.jpg', crop: 'Tomato', expGrade: 'C' },
    { file: 'onion_healthy.jpg', crop: 'Onion', expGrade: 'A' },
    { file: 'onion_black_mold.jpg', crop: 'Onion', expGrade: 'C' },
    { file: 'blurry_image.jpg', crop: 'Tomato', expGrade: 'REVIEW_REQUIRED' },
  ];

  let passedAll = true;

  for (const item of testFiles) {
    const fullPath = path.join(testDir, item.file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Test file not found: ${fullPath}`);
      continue;
    }

    const buffer = fs.readFileSync(fullPath);
    const result = await gradeCropImage({
      buffer,
      filePath: fullPath,
      originalname: item.file,
      cropType: item.crop,
    });

    const isMatch = result.grade === item.expGrade;
    if (!isMatch) passedAll = false;

    console.log(
      `[${isMatch ? 'PASS' : 'FAIL'}] ${item.file.padEnd(28)} | Exp: ${item.expGrade.padEnd(15)} | Got: ${result.grade.padEnd(15)} | Score: ${String(result.qualityScore).padEnd(5)} | Defect %: ${(result.features?.defectRatio * 100 || 0).toFixed(1)}% | Annotated: ${result.processedImageUrl ? 'YES' : 'NO'}`
    );
  }

  console.log('===============================================================');
  if (passedAll) {
    console.log('SUCCESS: All Node.js backend OpenCV grading integrations passed!');
  } else {
    console.log('FAILED: Some integrations failed.');
  }
  console.log('===============================================================');
}

runE2ETest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
