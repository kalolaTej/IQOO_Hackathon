/**
 * AgriSync - Mandi Price Refresh Job
 * Periodically or manually fetches latest commodity prices from data.gov.in AGMARKNET
 * and caches them into the mandi_prices table.
 * 
 * Usage: node backend/jobs/fetchMandiPrices.js
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { fetchFromGovernmentApi, cachePricesInDatabase } = require('../services/agmarknetService');

const COMMODITIES_TO_REFRESH = [
  'Tomato',
  'Wheat',
  'Onion',
  'Potato',
  'Rice',
  'Soybean',
  'Cotton',
  'Bengal Gram(Gram)(Whole)',
  'Cabbage',
  'Maize',
];

const runPriceRefreshJob = async () => {
  console.log(`[mandi job] Starting mandi price refresh at ${new Date().toISOString()}...`);
  let totalSaved = 0;

  for (const crop of COMMODITIES_TO_REFRESH) {
    try {
      console.log(`[mandi job] Fetching live records for commodity: ${crop}...`);
      const records = await fetchFromGovernmentApi({ crop, limit: 15 });
      if (records && records.length > 0) {
        await cachePricesInDatabase(records);
        totalSaved += records.length;
        console.log(`[mandi job] Cached ${records.length} real price records for ${crop}`);
      } else {
        console.log(`[mandi job] No live records returned for ${crop} (will use mock fallback on demand)`);
      }
    } catch (err) {
      console.warn(`[mandi job] Failed to refresh prices for ${crop}: ${err.message}`);
    }
  }

  console.log(`[mandi job] Price refresh completed. Total real records processed: ${totalSaved}`);
  return totalSaved;
};

// Run directly if invoked as standalone script
if (require.main === module) {
  runPriceRefreshJob()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[mandi job error]', err);
      process.exit(1);
    });
}

module.exports = { runPriceRefreshJob, COMMODITIES_TO_REFRESH };
