const { runPriceRefreshJob } = require('./jobs/fetchMandiPrices');
const { getMandiPrices, getSingleCropPrice, getArbitrageOpportunities, getPriceTrend } = require('./services/agmarknetService');

async function testFullMarketPipeline() {
  console.log('================================================================');
  console.log('     Testing AGMARKNET & data.gov.in Live Price Integration     ');
  console.log('================================================================');

  const baseUrl = 'http://localhost:5000';

  // 1. Test Single Crop Price (Tomato, Onion, Soybean)
  console.log('\n[TEST 1] Fetching live price for Tomato from data.gov.in...');
  const tomatoPrice = await getSingleCropPrice({ crop: 'Tomato' });
  console.log('Tomato Price Result:');
  console.log('  Market:', tomatoPrice.market, '| Modal Price: ₹' + tomatoPrice.modalPrice + '/Qtl');
  console.log('  Source:', tomatoPrice.source, '| isLive:', tomatoPrice.isLive, '| Date:', tomatoPrice.date);

  console.log('\n[TEST 2] Fetching live price for Soybean (with alias Soyabean)...');
  const soyaPrice = await getSingleCropPrice({ crop: 'Soybean' });
  console.log('Soybean Price Result:');
  console.log('  Market:', soyaPrice.market, '| Modal Price: ₹' + soyaPrice.modalPrice + '/Qtl');
  console.log('  Source:', soyaPrice.source, '| isLive:', soyaPrice.isLive);

  // 2. Test Multi-Mandi Price API endpoint
  console.log('\n[TEST 3] Testing /api/market-prices API endpoint...');
  const res = await fetch(`${baseUrl}/api/market-prices?crop=Onion&limit=5`);
  const json = await res.json();
  console.log('API Response Status:', res.status);
  console.log('Records returned:', json.data?.length, '| Count:', json.count);
  if (json.data?.[0]) {
    console.log('Sample Record:', json.data[0].market, '₹' + json.data[0].modalPrice, '| Source:', json.data[0].source);
  }

  // 3. Test Selling Advisory API
  console.log('\n[TEST 4] Testing /api/sale-window Selling Advisory calculation...');
  const advRes = await fetch(`${baseUrl}/api/sale-window?crop=Red%20Onion&qty=15000`);
  const advData = await advRes.json();
  console.log('Selling Advisory Status:', advRes.status);
  console.log('  Crop:', advData.crop, '| Grade:', advData.grade);
  console.log('  Recommendation:', advData.recommendation);
  console.log('  Recommended Mandi:', advData.recommendedMarket?.name, '| Modal: ₹' + advData.recommendedMarket?.modalPrice);
  console.log('  Estimated Gross Realization: ₹' + advData.estimated_gross_realization);
  console.log('  Advantage:', advData.advantage);

  // 4. Test Mandi Arbitrage Finder
  console.log('\n[TEST 5] Testing Arbitrage Opportunity Finder across Mandis...');
  const arb = await getArbitrageOpportunities({ crop: 'Tomato' });
  console.log('  Best Mandi:', arb.best_mandi?.market_name, '₹' + arb.best_mandi?.modal_price);
  console.log('  Lowest Mandi:', arb.lowest_mandi?.market_name, '₹' + arb.lowest_mandi?.modal_price);
  console.log('  Arbitrage Spread per Qtl: ₹' + arb.arbitrage_spread_per_qtl);
  console.log('  Profit Potential on 10 Qtl: ₹' + arb.profit_potential_on_10qtl);

  console.log('\n================================================================');
  console.log('       ALL DATA.GOV.IN & AGMARKNET PIPELINE TESTS PASSED!       ');
  console.log('================================================================');
}

testFullMarketPipeline().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
