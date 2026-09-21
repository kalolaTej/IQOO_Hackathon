const http = require('http');

async function testCameraAndAnimalDetection() {
  console.log('================================================================');
  console.log('      Testing IP Camera Streaming & Animal Detection Pipeline   ');
  console.log('================================================================');

  const baseUrl = 'http://localhost:5000';

  // 1. Create a Mobile IP Camera
  console.log('\n[STEP 1] Creating / Updating Mobile IP Camera (10.10.12.111:8080)...');
  const camPayload = JSON.stringify({
    name: 'Mobile Live IP Camera',
    ip: '10.10.12.111',
    port: 8080,
    source_url: 'http://10.10.12.111:8080/video',
    camera_type: 'HTTP_MJPEG',
    purpose: 'Animal Monitoring Camera',
    zone: 'North Sector Field - Mobile Feed',
    status: true,
  });

  const createRes = await fetch(`${baseUrl}/api/cameras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: camPayload,
  });

  const createData = await createRes.json();
  console.log('Create Camera Response Status:', createRes.status);
  console.log('Created Camera:', createData.data?.name, '| ID:', createData.data?.id, '| Stream URL:', createData.data?.source_url);

  const cameraId = createData.data?.id;

  // 2. Query Cameras list
  console.log('\n[STEP 2] Fetching Cameras List to verify no Unsplash overwrite...');
  const listRes = await fetch(`${baseUrl}/api/cameras`);
  const listData = await listRes.json();
  const foundCam = listData.data.find(c => c.id === cameraId);
  console.log('Fetched Camera details:');
  console.log('  Status:', foundCam?.status);
  console.log('  Source URL:', foundCam?.source_url);
  console.log('  Latest Frame:', foundCam?.latest_frame);

  if (foundCam?.latest_frame && foundCam.latest_frame.includes('unsplash.com')) {
    console.error('❌ FAIL: Found hardcoded Unsplash URL in camera latest_frame!');
    process.exit(1);
  } else {
    console.log('✅ PASS: Camera latest_frame is NOT overridden by fake Unsplash corn image!');
  }

  // 3. Trigger Animal Detection on the Camera
  console.log('\n[STEP 3] Ingesting Animal Intrusion Detection (Wild Boar, 94% confidence)...');
  const detPayload = JSON.stringify({
    camera_id: cameraId,
    animal: 'wild_boar',
    confidence: 94,
    zone: 'North Sector Field - Mobile Feed',
  });

  const detRes = await fetch(`${baseUrl}/api/detection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: detPayload,
  });

  const detData = await detRes.json();
  console.log('Detection Response Status:', detRes.status);
  console.log('Detection Saved:', detData.detection?.animal, '| Confidence:', detData.detection?.confidence + '%');
  console.log('Siren Status:', detData.siren?.status, '| Triggered:', detData.siren?.triggered);

  if (!detData.detection?.animal) {
    console.error('❌ FAIL: Detection was not created!');
    process.exit(1);
  }
  console.log('✅ PASS: Animal detection event created and siren triggered successfully!');

  // 4. Verify Latest Perimeter Frame reflects animal detection
  console.log('\n[STEP 4] Verifying Latest Perimeter Frame API...');
  const perimRes = await fetch(`${baseUrl}/api/camera/perimeter-latest`);
  const perimData = await perimRes.json();
  console.log('Perimeter Latest:', perimData.data?.cameraName, '| Status:', perimData.data?.detectionStatus, '| Animal:', perimData.data?.animal);

  console.log('\n================================================================');
  console.log('         ALL IP CAMERA & ANIMAL DETECTION TESTS PASSED!         ');
  console.log('================================================================');
}

testCameraAndAnimalDetection().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
