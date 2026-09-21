async function testDataGovIn() {
  console.log('Testing data.gov.in AGMARKNET API Connection...');
  const apiKey = '579b464db66ec23bdd000001c923c640fc2c477942ab446a95499a8b';
  const resourceId = '9ef84268-d588-465a-a308-a864a43d0070';
  const endpoint = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=10`;

  try {
    const res = await fetch(endpoint, {
      headers: { 'User-Agent': 'AgriSync/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    console.log('Status code:', res.status);
    console.log('Headers content-type:', res.headers.get('content-type'));

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log('JSON parsed successfully!');
      console.log('Total records available in dataset:', json.total);
      console.log('Count returned:', json.count);
      console.log('Sample record fields:', json.records?.[0] ? Object.keys(json.records[0]) : 'None');
      console.log('Sample record 1:', json.records?.[0]);
      console.log('Sample record 2:', json.records?.[1]);

      // Test specific filters: Onion, Tomato, Potato
      console.log('\nTesting commodity filter: Tomato');
      const tomatoUrl = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=5&filters[commodity]=Tomato`;
      const tomatoRes = await fetch(tomatoUrl);
      const tomatoJson = await tomatoRes.json();
      console.log('Tomato results count:', tomatoJson.count, '| Total:', tomatoJson.total);
      if (tomatoJson.records?.[0]) {
        console.log('Sample Tomato Mandi:', tomatoJson.records[0].market, '| Modal Price:', tomatoJson.records[0].modal_price, '| State:', tomatoJson.records[0].state);
      }

      // Test commodity filter: Onion
      console.log('\nTesting commodity filter: Onion');
      const onionUrl = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=5&filters[commodity]=Onion`;
      const onionRes = await fetch(onionUrl);
      const onionJson = await onionRes.json();
      console.log('Onion results count:', onionJson.count, '| Total:', onionJson.total);
      if (onionJson.records?.[0]) {
        console.log('Sample Onion Mandi:', onionJson.records[0].market, '| Modal Price:', onionJson.records[0].modal_price, '| State:', onionJson.records[0].state);
      }

    } catch (e) {
      console.error('Failed to parse response as JSON:', text.substring(0, 300));
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testDataGovIn();
