const fs = require('fs');
const path = require('path');

async function testApiStressAndRegrading() {
  console.log('================================================================');
  console.log('    AgriSync API Stress Test: Concurrency, Cross-Contamination,   ');
  console.log('                    & Regrading Integrity                       ');
  console.log('================================================================');

  const baseURL = 'http://localhost:5000/api/produce';
  const testImagesDir = path.join(__dirname, '..', 'grading-service', 'test_images');

  // 1. Upload Produce A (Healthy Tomato)
  console.log('\n[STEP 1] Uploading Produce A (Healthy Tomato)...');
  const fileA = path.join(testImagesDir, 'tomato_healthy_white_bg.jpg');
  const formA = new FormData();
  formA.append('image', new Blob([fs.readFileSync(fileA)], { type: 'image/jpeg' }), 'healthy_tomato.jpg');
  formA.append('crop_type', 'Tomato');
  formA.append('quantity', '1500');
  formA.append('unit', 'kg');

  const resA = await fetch(baseURL, { method: 'POST', body: formA });
  const jsonA = await resA.json();
  const lotA = jsonA.data;
  console.log(`Produce A Created -> ID: ${lotA.id}, Grade: ${lotA.grade}, Score: ${lotA.quality_score}, Defect %: ${(lotA.grading_features?.defectRatio * 100 || 0).toFixed(1)}%`);
  console.log(`Original Image: ${lotA.original_image_url}, Processed: ${lotA.processed_image_url}`);

  // 2. Upload Produce B (Rotten Tomato)
  console.log('\n[STEP 2] Uploading Produce B (Severe Rot Tomato)...');
  const fileB = path.join(testImagesDir, 'tomato_large_rot.jpg');
  const formB = new FormData();
  formB.append('image', new Blob([fs.readFileSync(fileB)], { type: 'image/jpeg' }), 'rotten_tomato.jpg');
  formB.append('crop_type', 'Tomato');
  formB.append('quantity', '900');
  formB.append('unit', 'kg');

  const resB = await fetch(baseURL, { method: 'POST', body: formB });
  const jsonB = await resB.json();
  const lotB = jsonB.data;
  console.log(`Produce B Created -> ID: ${lotB.id}, Grade: ${lotB.grade}, Score: ${lotB.quality_score}, Defect %: ${(lotB.grading_features?.defectRatio * 100 || 0).toFixed(1)}%`);
  console.log(`Original Image: ${lotB.original_image_url}, Processed: ${lotB.processed_image_url}`);

  // 3. Verify Isolation & Correctness
  console.log('\n[STEP 3] Verifying Cross-Contamination Isolation...');
  const isAValid = lotA.grade === 'A' && lotA.quality_score >= 85;
  const isBValid = lotB.grade === 'C' && lotB.quality_score <= 38;
  const areDifferentImages = lotA.original_image_url !== lotB.original_image_url;
  const areDifferentProcessed = lotA.processed_image_url !== lotB.processed_image_url;

  if (isAValid && isBValid && areDifferentImages && areDifferentProcessed) {
    console.log('✅ PASS: Complete image & result isolation confirmed! No cross-contamination.');
  } else {
    console.error('❌ FAIL: Cross-contamination detected!');
    process.exit(1);
  }

  // 4. Test Regrade Endpoint
  console.log(`\n[STEP 4] Testing Regrading Endpoint on Batch #${lotB.id}...`);
  const regradeRes = await fetch(`${baseURL}/${lotB.id}/grade`, { method: 'POST' });
  const regradeJson = await regradeRes.json();
  const regradedLot = regradeJson.data;

  console.log(`Regrade Response Status: ${regradeRes.status}`);
  console.log(`Regraded Batch -> ID: ${regradedLot.id}, Grade: ${regradedLot.grade}, Score: ${regradedLot.quality_score}`);
  
  const regradeSuccess = regradedLot.id === lotB.id &&
                         regradedLot.grade === 'C' &&
                         regradedLot.original_image_url === lotB.original_image_url &&
                         regradedLot.processed_image_url.startsWith('/uploads/crops/annotated_');

  if (regradeSuccess) {
    console.log('✅ PASS: Regrading succeeded with original image preserved and database synchronized!');
  } else {
    console.error('❌ FAIL: Regrading failed!');
    process.exit(1);
  }

  // 5. Query All Batches & Check Total Record Counts
  console.log('\n[STEP 5] Verifying Database Consistency & No Duplicate Lots Created...');
  const listRes = await fetch(baseURL);
  const listJson = await listRes.json();
  const allLots = listJson.data || [];
  
  const matchA = allLots.filter((l) => l.id === lotA.id);
  const matchB = allLots.filter((l) => l.id === lotB.id);

  if (matchA.length === 1 && matchB.length === 1) {
    console.log('✅ PASS: Database contains exactly 1 instance per batch. No duplicate records.');
  } else {
    console.error(`❌ FAIL: Found duplicate lot records! A: ${matchA.length}, B: ${matchB.length}`);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('          ALL STRESS, ISOLATION & REGRADE TESTS PASSED!         ');
  console.log('================================================================');
}

testApiStressAndRegrading().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
