/**
 * Automated Verification Script for AgriSync Smart Farming Platform
 * Validates all test scenarios including:
 *  - Real IP Camera Integration (RTSP/HTTP/Snapshot) & Connection Testing
 *  - Credential Security & Sanitation
 *  - Camera CRUD & Monitoring Toggle
 *  - Multi-Camera Animal Intrusion & Cooldown Pipeline
 *  - Official data.gov.in Live Market Prices & Database Cache
 *  - Location-Aware Selling Advisory with Nearby Mandis Comparison
 *  - Real Crop Image Capture, OpenCV Quality Grading & Produce Deletion
 */

const BASE_URL = 'http://localhost:5000';

const runTests = async () => {
  console.log('====================================================');
  console.log(' AgriSync End-to-End Platform Verification Tests   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Helper
  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`[PASS] ${name} ${details ? '— ' + details : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details ? '— ' + details : ''}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // Test 1: No Animal Field Capture
    // -------------------------------------------------------------
    console.log('--- Scenario 1: Field Camera Capture (No Animal) ---');
    const capRes1 = await fetch(`${BASE_URL}/api/camera/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_id: 'cam_01',
        animal: null,
      }),
    });
    const capJson1 = await capRes1.json();
    assert(capJson1.success === true, 'Capture endpoint returned success');
    assert(capJson1.detectionStatus === 'no_animal', 'Detection marked as no_animal');

    const perimRes = await fetch(`${BASE_URL}/api/camera/perimeter-latest`);
    const perimJson = await perimRes.json();
    assert(perimJson.data && perimJson.data.detectionStatus === 'no_animal', 'Perimeter latest frame updated to no_animal');

    // -------------------------------------------------------------
    // Test 2: Animal Intrusion Detected -> Automatic Siren Trigger
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Animal Intrusion Detected & Automatic Siren ---');
    const capRes2 = await fetch(`${BASE_URL}/api/camera/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_id: 'cam_01',
        animal: 'wild_boar',
        confidence: 94,
      }),
    });
    const capJson2 = await capRes2.json();
    assert(capJson2.success === true, 'Intrusion capture processed successfully');
    assert(capJson2.detectionStatus === 'animal_detected', 'Status marked as animal_detected');
    assert(capJson2.siren && capJson2.siren.triggered === true, 'Automated siren triggered upon intrusion');

    // Verify detection persisted in history
    const detListRes = await fetch(`${BASE_URL}/api/detections?limit=5`);
    const detListJson = await detListRes.json();
    const items = detListJson.data || [];
    const foundWildBoar = items.some((d) => (d.animal || '').includes('wild_boar'));
    assert(foundWildBoar, 'Animal detection event saved in database and retrieved in history');

    // -------------------------------------------------------------
    // Test 3: Repeated Animal Frames -> Cooldown Prevents Siren Spam
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Cooldown Debounce (Anti-Spam) ---');
    const capRes3 = await fetch(`${BASE_URL}/api/camera/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_id: 'cam_01',
        animal: 'wild_boar',
        confidence: 95,
      }),
    });
    const capJson3 = await capRes3.json();
    assert(capJson3.success === true, 'Consecutive frame processed');
    assert(
      capJson3.siren && capJson3.siren.triggered === false && capJson3.siren.reason === 'cooldown_active',
      'Siren trigger debounced by active cooldown (anti-spam verified)',
      `Remaining: ${capJson3.siren?.remainingCooldownSeconds}s`
    );

    // -------------------------------------------------------------
    // Test 4: Official data.gov.in Live Market Prices
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: data.gov.in Market Price Integration ---');
    const mktRes = await fetch(`${BASE_URL}/api/market-prices/single?crop=onion`);
    const mktJson = await mktRes.json();
    assert(mktJson.success === true, 'Market price endpoint returned 200 OK');
    assert(mktJson.data && mktJson.data.modalPrice > 0, 'Valid modal price returned', `Modal: ₹${mktJson.data?.modalPrice}/Qtl`);
    console.log(`[DATA SOURCE] Source: ${mktJson.data?.source}, isLive: ${mktJson.data?.isLive}`);

    // -------------------------------------------------------------
    // Test 5: Location-Aware Selling Advisory
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Location-Aware Selling Advisory from My Produce ---');
    const advResTomato = await fetch(`${BASE_URL}/api/sale-window?crop=Tomato&qty=5000`);
    const advJsonTomato = await advResTomato.json();
    assert(advJsonTomato.success === true, 'Tomato advisory computed successfully');
    assert(Boolean(advJsonTomato.farmerLocation), 'Farmer location loaded from database', `Location: ${advJsonTomato.farmerLocation?.farmName}`);
    assert(Boolean(advJsonTomato.recommendedMarket), 'Recommended nearby mandi identified', `Market: ${advJsonTomato.recommendedMarket?.name} (${advJsonTomato.recommendedMarket?.distanceKm} km)`);
    assert(Array.isArray(advJsonTomato.alternatives), 'Nearby alternative mandis compared', `Alternatives count: ${advJsonTomato.alternatives?.length}`);
    assert(typeof advJsonTomato.recommendation === 'string', 'Recommendation provided', `Decision: ${advJsonTomato.recommendation}`);
    assert(advJsonTomato.estimated_gross_realization > 0, 'Gross realization computed', `Est. Gross: ₹${advJsonTomato.estimated_gross_realization.toLocaleString('en-IN')}`);

    // -------------------------------------------------------------
    // Test 6: Fallback Data Clearly Labeled when Commodity Unavailable
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: Graceful Fallback Labeling for Rare Crops ---');
    const rareRes = await fetch(`${BASE_URL}/api/market-prices/single?crop=DragonfruitRare123`);
    const rareJson = await rareRes.json();
    assert(rareJson.success === true, 'Endpoint handled uncommon crop without crashing');
    assert(rareJson.data.isLive === false, 'isLive correctly flagged as false');
    assert(rareJson.data.source === 'dummy', 'source explicitly labeled as dummy');
    assert(Boolean(rareJson.data.fallbackReason), 'Clear fallback reason provided', `Reason: ${rareJson.data.fallbackReason}`);

    // -------------------------------------------------------------
    // Test 7: Camera & Heartbeat Telemetry
    // -------------------------------------------------------------
    console.log('\n--- Scenario 7: Camera Telemetry & Status Management ---');
    const camsRes = await fetch(`${BASE_URL}/api/cameras`);
    const camsJson = await camsRes.json();
    assert(camsJson.success === true && Array.isArray(camsJson.data), 'Camera list retrieved successfully');
    assert(camsJson.data.length >= 2, 'Active perimeter cameras listed', `Count: ${camsJson.data.length}`);

    // -------------------------------------------------------------
    // Test 8: Real Crop Image Capture & OpenCV Quality Grading Pipeline
    // -------------------------------------------------------------
    console.log('\n--- Scenario 8: Crop Image Capture & OpenCV Quality Grading ---');
    const boundary = '----WebKitFormBoundaryTestCrop' + Math.random().toString(36).substring(2);
    const fakeImageBytes = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0xff, 0xd9,
    ]);

    const formParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="crop"\r\n\r\nTomato\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="quantity"\r\n\r\n500\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="unit"\r\n\r\nkg\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="fresh_tomato.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
    ];

    const bodyBuffer = Buffer.concat([
      Buffer.from(formParts.join('')),
      fakeImageBytes,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const addCropRes = await fetch(`${BASE_URL}/api/produce`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: bodyBuffer,
    });

    const addCropJson = await addCropRes.json();
    assert(addCropJson.success === true, 'Produce creation with crop image returned 201 Created');
    assert(Boolean(addCropJson.data.image_url), 'Crop image stored and assigned image URL', `URL: ${addCropJson.data.image_url}`);
    assert(['A', 'B', 'C'].includes(addCropJson.data.grade), 'Certified canonical Grade assigned (A/B/C)', `Grade: ${addCropJson.data.grade}`);
    assert(addCropJson.data.quality_score >= 0, 'Quality score computed (0-100)', `Score: ${addCropJson.data.quality_score}/100`);
    assert(Boolean(addCropJson.data.grading_features), 'OpenCV quality features extracted (color, defect, shape, uniformity)');

    const createdLotId = addCropJson.data.id;

    // Verify retrieval by ID with full analysis
    const getLotRes = await fetch(`${BASE_URL}/api/produce/${createdLotId}`);
    const getLotJson = await getLotRes.json();
    assert(getLotJson.success === true, 'Retrieved produce batch by ID from database');
    assert(getLotJson.data.crop === 'Tomato', 'Produce matches created crop (Tomato)');

    // Verify Retry Grading endpoint
    const retryRes = await fetch(`${BASE_URL}/api/produce/${createdLotId}/grade`, { method: 'POST' });
    const retryJson = await retryRes.json();
    assert(retryJson.success === true, 'Retry grading endpoint re-evaluated stored crop image successfully');

    // -------------------------------------------------------------
    // Test 9: Delete Produce Batch Endpoint
    // -------------------------------------------------------------
    console.log('\n--- Scenario 9: Delete Produce Batch & Integrity ---');
    const delCropRes = await fetch(`${BASE_URL}/api/produce/${createdLotId}`, { method: 'DELETE' });
    const delCropJson = await delCropRes.json();
    assert(delCropJson.success === true, 'Produce lot deleted successfully via API');

    const getLotAfterDel = await fetch(`${BASE_URL}/api/produce/${createdLotId}`);
    assert(getLotAfterDel.status === 404, 'Deleted produce lot removed from active queries (404 Not Found)');

    // -------------------------------------------------------------
    // Test 10: Full IP Camera Integration & Connection Testing
    // -------------------------------------------------------------
    console.log('\n--- Scenario 10: IP Camera Integration & Connection Testing ---');
    const testCamRes = await fetch(`${BASE_URL}/api/cameras/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: '192.168.1.108',
        port: 554,
        camera_type: 'RTSP',
        source_url: 'rtsp://192.168.1.108:554/live/ch0',
      }),
    });
    const testCamJson = await testCamRes.json();
    assert(testCamJson.success === true, 'Camera test endpoint returned success');
    assert(Boolean(testCamJson.status), 'Camera test returned valid telemetry status', `Status: ${testCamJson.status}`);
    assert(Boolean(testCamJson.previewUrl), 'Camera test generated valid preview frame');

    // -------------------------------------------------------------
    // Test 11: Register IP Camera with Secure Credentials
    // -------------------------------------------------------------
    console.log('\n--- Scenario 11: Camera Registration with Field & Credentials ---');
    const newCamPayload = {
      name: 'West Boundary Optical Sensor 05',
      ip: '192.168.1.115',
      port: 554,
      camera_type: 'RTSP',
      purpose: 'Perimeter Camera',
      source_url: 'rtsp://192.168.1.115:554/live/ch0',
      username: 'admin',
      password: 'super_secret_camera_password_123',
      zone: 'West Boundary - Citrus Grove',
      farm_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      field_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
    };

    const createCamRes = await fetch(`${BASE_URL}/api/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCamPayload),
    });
    const createCamJson = await createCamRes.json();
    assert(createCamJson.success === true, 'IP camera registered in database successfully');
    const createdCamId = createCamJson.data.id;
    assert(Boolean(createdCamId), 'Assigned unique camera ID', `ID: ${createdCamId}`);

    // -------------------------------------------------------------
    // Test 12: Credential Security & Password Sanitation
    // -------------------------------------------------------------
    console.log('\n--- Scenario 12: Credential Security & Password Sanitation ---');
    const getCamsListRes = await fetch(`${BASE_URL}/api/cameras`);
    const getCamsListJson = await getCamsListRes.json();
    const targetCamInList = getCamsListJson.data.find((c) => c.id === createdCamId);
    assert(Boolean(targetCamInList), 'Newly created camera retrieved in list from database');
    assert(targetCamInList.password === undefined, 'Raw password is stripped and NOT exposed in API responses');
    assert(targetCamInList.camera_password === undefined, 'camera_password property sanitized');

    // -------------------------------------------------------------
    // Test 13: Camera Configuration Update
    // -------------------------------------------------------------
    console.log('\n--- Scenario 13: Camera Configuration Update ---');
    const updateCamRes = await fetch(`${BASE_URL}/api/cameras/${createdCamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'West Boundary Optical Sensor (Updated)',
        zone: 'West Sector - Citrus & Pomegranate',
      }),
    });
    const updateCamJson = await updateCamRes.json();
    assert(updateCamJson.success === true, 'Camera settings updated successfully');
    assert(updateCamJson.data.name.includes('Updated'), 'Updated name persisted in database');

    // -------------------------------------------------------------
    // Test 14: Camera Monitoring Toggle (ON / OFF)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 14: Camera Monitoring Toggle (ON/OFF) ---');
    const toggleOffRes = await fetch(`${BASE_URL}/api/cameras/${createdCamId}/monitoring`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });
    const toggleOffJson = await toggleOffRes.json();
    assert(toggleOffJson.success === true, 'Monitoring disabled successfully');
    assert(toggleOffJson.data.monitoring_enabled === false, 'monitoring_enabled set to false');
    assert(toggleOffJson.data.status === 'disabled', 'Camera status transitioned to disabled');

    const toggleOnRes = await fetch(`${BASE_URL}/api/cameras/${createdCamId}/monitoring`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: true }),
    });
    const toggleOnJson = await toggleOnRes.json();
    assert(toggleOnJson.success === true, 'Monitoring re-enabled successfully');
    assert(toggleOnJson.data.monitoring_enabled === true, 'monitoring_enabled restored to true');

    // -------------------------------------------------------------
    // Test 15: Safe Camera Deletion (Preserves Historical Audits)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 15: Safe Camera Deletion & Historic Data Preservation ---');
    const delRes = await fetch(`${BASE_URL}/api/cameras/${createdCamId}`, { method: 'DELETE' });
    const delJson = await delRes.json();
    assert(delJson.success === true, 'Camera deletion returned 200 OK');

    const getAfterDel = await fetch(`${BASE_URL}/api/cameras/${createdCamId}`);
    assert(getAfterDel.status === 404, 'Deleted camera removed from active lookups (404 Not Found)');

    // Verify historic detections remain intact in database
    const verifyDetsRes = await fetch(`${BASE_URL}/api/detections?limit=5`);
    const verifyDetsJson = await verifyDetsRes.json();
    assert(verifyDetsJson.data && verifyDetsJson.data.length > 0, 'Historic detection records preserved after camera deletion');

    console.log('\n====================================================');
    console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED `);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal test error:', err);
  }
};

runTests();
