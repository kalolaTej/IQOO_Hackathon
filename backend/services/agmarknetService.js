/**
 * AgriSync - AGMARKNET Government API Integration & Cache Service
 * Resource: data.gov.in "Current Daily Price of Various Commodities from Various Markets (Mandi)"
 * Dataset ID: 9ef84268-d588-465a-a308-a864a43d0070
 */

const supabase = require('./supabaseClient');
const localStore = require('../database/localStore');
const { MOCK_MANDI_PRICES, MOCK_PRICE_TRENDS } = require('../mock/marketMockData');

const AGMARKNET_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const AGMARKNET_BASE_URL = `https://api.data.gov.in/resource/${AGMARKNET_RESOURCE_ID}`;
const DEFAULT_API_KEY = process.env.DATA_GOV_IN_API_KEY || process.env.AGMARKNET_API_KEY || '579b464db66ec23bdd000001c923c640fc2c477942ab446a95499a8b';

// In-memory runtime cache with TTL (10 minutes) for live government responses
const queryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Standardize arrival_date string (e.g., "14/09/2026" or "2026-09-14") to "YYYY-MM-DD"
 */
const parseArrivalDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const str = String(dateStr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  return new Date().toISOString().split('T')[0];
};

/**
 * Standardize user crop name to canonical AGMARKNET / data.gov.in commodity name
 */
const normalizeCommodityForGovApi = (rawCrop) => {
  if (!rawCrop || typeof rawCrop !== 'string' || rawCrop === 'All Crops' || rawCrop === 'All') return null;
  const s = rawCrop.toLowerCase().trim();
  if (s.includes('soya') || s.includes('soybean')) return 'Soyabean';
  if (s.includes('onion')) return 'Onion';
  if (s.includes('tomato')) return 'Tomato';
  if (s.includes('potato') || s.includes('batata')) return 'Potato';
  if (s.includes('wheat') || s.includes('gehun')) return 'Wheat';
  if (s.includes('pomegranate') || s.includes('anar')) return 'Pomegranate';
  if (s.includes('grape')) return 'Grapes';
  if (s.includes('cotton') || s.includes('kapas')) return 'Cotton';
  if (s.includes('maize') || s.includes('corn') || s.includes('makka')) return 'Maize';
  if (s.includes('rice') || s.includes('paddy') || s.includes('dhan')) return 'Paddy(Dhan)(Common)';
  if (s.includes('chana') || s.includes('gram') || s.includes('chhana')) return 'Gram Raw(Chhana)';
  if (s.includes('chilli') || s.includes('mirchi')) return 'Green Chilli';
  if (s.includes('garlic') || s.includes('lahsun')) return 'Garlic';
  if (s.includes('ginger') || s.includes('adrak')) return 'Ginger(Green)';
  if (s.includes('turmeric') || s.includes('haldi')) return 'Turmeric';
  if (s.includes('cabbage') || s.includes('patta')) return 'Cabbage';
  if (s.includes('cauliflower') || s.includes('phool')) return 'Cauliflower';
  if (s.includes('brinjal') || s.includes('eggplant') || s.includes('baingan')) return 'Brinjal';
  if (s.includes('bhindi') || s.includes('okra') || s.includes('ladyfinger')) return 'Bhindi(Ladies Finger)';
  if (s.includes('banana') || s.includes('kela')) return 'Banana';
  if (s.includes('apple') || s.includes('seb')) return 'Apple';
  return rawCrop.trim();
};

/**
 * Cache standardized market price records in database
 */
const cachePricesInDatabase = async (records) => {
  if (!Array.isArray(records) || records.length === 0) return;
  try {
    for (const rec of records) {
      const cacheId = `cache_${(rec.crop || 'crop').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${(rec.market || 'mkt').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      if (typeof localStore.upsert === 'function') {
        localStore.upsert('market_prices_cache', {
          ...rec,
          id: cacheId,
        });
      } else {
        localStore.insert('market_prices_cache', {
          ...rec,
          id: cacheId,
        });
      }
      try {
        await supabase.from('mandi_prices').upsert([{
          id: cacheId,
          crop: rec.crop,
          market: rec.market,
          state: rec.state,
          district: rec.district,
          modal_price: rec.modalPrice || rec.modal_price,
          min_price: rec.minPrice || rec.min_price,
          max_price: rec.maxPrice || rec.max_price,
          date: rec.date || rec.price_date,
          source: 'data.gov.in',
          updated_at: new Date().toISOString(),
        }]);
      } catch {}
    }
  } catch (err) {
    console.warn(`[MARKET CACHE] Error caching prices: ${err.message}`);
  }
};

/**
 * Fetch live mandi prices from data.gov.in AGMARKNET API with automatic retry
 */
const fetchFromGovernmentApi = async ({ crop, state, district, market, limit = 50 }) => {
  const normalizedCrop = normalizeCommodityForGovApi(crop);
  const cacheKey = `${normalizedCrop || crop || 'all'}_${state || 'all'}_${district || 'all'}_${market || 'all'}_${limit}`;
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = process.env.DATA_GOV_IN_API_KEY || process.env.AGMARKNET_API_KEY || DEFAULT_API_KEY;
  const url = new URL(AGMARKNET_BASE_URL);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(Math.min(limit, 100)));

  if (normalizedCrop) {
    url.searchParams.set('filters[commodity]', normalizedCrop);
  }
  if (state && state !== 'All States' && state !== 'All') {
    url.searchParams.set('filters[state]', state);
  }
  if (district && district !== 'All Districts' && district !== 'All') {
    url.searchParams.set('filters[district]', district);
  }
  if (market) {
    url.searchParams.set('filters[market]', market);
  }

  // Attempt fetch with 1 retry on connection timeout
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

    try {
      console.log(`[MARKET] Fetching live data from data.gov.in (Crop: ${normalizedCrop || crop || 'All'}, Attempt: ${attempt})`);
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgriSync-NationalPlatform/1.0',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`[MARKET] HTTP 429: data.gov.in rate limit reached.`);
        } else {
          console.warn(`[MARKET] HTTP ${response.status} from data.gov.in`);
        }
        return [];
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.records) || data.records.length === 0) {
        console.log(`[MARKET] data.gov.in returned 0 records for ${normalizedCrop || crop || 'All'}`);
        return [];
      }

      console.log(`[MARKET] Live data found on data.gov.in (${data.records.length} records for ${normalizedCrop || crop || 'All'})`);

      const validRecords = data.records.filter((r) => {
        const modal = parseFloat(r.modal_price);
        return !isNaN(modal) && modal >= 50;
      });

      const standardized = (validRecords.length > 0 ? validRecords : data.records).map((r) => ({
        crop: r.commodity || crop || 'General Crop',
        crop_type: r.commodity || crop || 'General Crop',
        market: r.market || 'APMC Mandi',
        market_name: r.market || 'APMC Mandi',
        state: r.state || state || 'India',
        district: r.district || r.market || 'District',
        minPrice: parseFloat(r.min_price) || 0,
        maxPrice: parseFloat(r.max_price) || 0,
        modalPrice: parseFloat(r.modal_price) || 0,
        min_price: parseFloat(r.min_price) || 0,
        max_price: parseFloat(r.max_price) || 0,
        modal_price: parseFloat(r.modal_price) || 0,
        date: parseArrivalDate(r.arrival_date),
        price_date: parseArrivalDate(r.arrival_date),
        source: 'data.gov.in',
        isLive: true,
        isCached: false,
        fetchedAt: new Date().toISOString(),
      }));

      queryCache.set(cacheKey, { data: standardized, timestamp: Date.now() });

      // Cache records in database
      cachePricesInDatabase(standardized);

      return standardized;
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt === 1) {
        console.warn(`[MARKET] Transient network error on data.gov.in attempt 1: ${err.message}. Retrying in 1s...`);
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        console.warn(`[MARKET] Network or fetch error reaching data.gov.in: ${err.message}`);
      }
    }
  }

  return [];
};

/**
 * Filter mock fallback data by crop, state, and market
 */
const getMockFallbackPrices = ({ crop, state, district, market }) => {
  console.log(`[MARKET] No live data available from data.gov.in. Using clearly labeled fallback dummy data for crop: ${crop || 'All'}`);
  let fallback = [...MOCK_MANDI_PRICES];

  if (crop && crop !== 'All Crops') {
    const cropLower = crop.toLowerCase().trim();
    fallback = fallback.filter((p) => (p.crop_type || '').toLowerCase().includes(cropLower));
  }

  if (state && state !== 'All States') {
    const stateLower = state.toLowerCase().trim();
    fallback = fallback.filter((p) => (p.state || '').toLowerCase().includes(stateLower));
  }

  if (market) {
    const marketLower = market.toLowerCase().trim();
    fallback = fallback.filter((p) => (p.market_name || '').toLowerCase().includes(marketLower));
  }

  if (fallback.length === 0 && crop) {
    const today = new Date().toISOString().split('T')[0];
    fallback = [
      {
        crop_type: crop,
        market_name: market || 'Regional APMC Mandi',
        state: state || 'Maharashtra',
        min_price: 2100,
        max_price: 2600,
        modal_price: 2350,
        price_date: today,
      },
    ];
  }

  return fallback.map((item) => ({
    crop: item.crop_type,
    crop_type: item.crop_type,
    market: item.market_name,
    market_name: item.market_name,
    state: item.state,
    district: item.market_name,
    minPrice: item.min_price,
    maxPrice: item.max_price,
    modalPrice: item.modal_price,
    min_price: item.min_price,
    max_price: item.max_price,
    modal_price: item.modal_price,
    date: item.price_date,
    price_date: item.price_date,
    source: 'dummy',
    isLive: false,
    isCached: false,
    fallbackReason: 'No matching live market data available from data.gov.in',
  }));
};

/**
 * Primary Price Retrieval Service
 * Queries data.gov.in -> then checks database cache -> then returns labeled fallback
 */
const getMandiPrices = async ({ crop, state, district, market, limit = 50 }) => {
  // 1. Try real government API
  try {
    const liveRecords = await fetchFromGovernmentApi({ crop, state, district, market, limit });
    if (liveRecords && liveRecords.length > 0) {
      return liveRecords;
    }
  } catch (err) {
    console.warn(`[MARKET] API error: ${err.message}`);
  }

  // 2. Check Database Cache for recently stored data.gov.in results
  try {
    const cachedRows = localStore.find('market_prices_cache') || [];
    if (cachedRows.length > 0) {
      let matchedCache = [...cachedRows];
      if (crop && crop !== 'All Crops' && crop !== 'All') {
        const cropLower = crop.toLowerCase().trim();
        matchedCache = matchedCache.filter((r) => (r.crop || '').toLowerCase().includes(cropLower));
      }
      if (state && state !== 'All States' && state !== 'All') {
        const stateLower = state.toLowerCase().trim();
        matchedCache = matchedCache.filter((r) => (r.state || '').toLowerCase().includes(stateLower));
      }
      if (district && district !== 'All Districts' && district !== 'All') {
        const districtLower = district.toLowerCase().trim();
        matchedCache = matchedCache.filter((r) => (r.district || '').toLowerCase().includes(districtLower));
      }
      if (market) {
        const marketLower = market.toLowerCase().trim();
        matchedCache = matchedCache.filter((r) => (r.market || '').toLowerCase().includes(marketLower));
      }
      if (matchedCache.length > 0) {
        return matchedCache.map((c) => ({
          ...c,
          isLive: false,
          isCached: true,
          source: 'data.gov.in (Cached)',
        }));
      }
    }
  } catch {}

  // 3. Return Guaranteed Labeled Mock Fallback
  return getMockFallbackPrices({ crop, state, district, market });
};

/**
 * Retrieve Single Crop Market Price Object
 */
const getSingleCropPrice = async ({ crop = 'Tomato', state = null, district = null, market = null }) => {
  const prices = await getMandiPrices({ crop, state, district, market, limit: 1 });
  if (prices && prices.length > 0) {
    return prices[0];
  }

  const today = new Date().toISOString().split('T')[0];
  return {
    crop: crop || 'General Crop',
    crop_type: crop || 'General Crop',
    market: market || 'Ahmedabad APMC',
    market_name: market || 'Ahmedabad APMC',
    state: state || 'Gujarat',
    district: district || 'Ahmedabad',
    minPrice: 1800,
    maxPrice: 2400,
    modalPrice: 2100,
    min_price: 1800,
    max_price: 2400,
    modal_price: 2100,
    date: today,
    price_date: today,
    source: 'dummy',
    isLive: false,
    isCached: false,
    fallbackReason: 'No live market data available for this commodity',
  };
};

/**
 * Retrieve Chronological Price Trend for a crop & market
 */
const getPriceTrend = async ({ crop, market }) => {
  if (!crop) crop = 'Tomato';

  if (MOCK_PRICE_TRENDS[crop]) {
    return [...MOCK_PRICE_TRENDS[crop]];
  }

  const mockMatches = getMockFallbackPrices({ crop, market });
  mockMatches.sort((a, b) => new Date(a.date || a.price_date) - new Date(b.date || b.price_date));
  return mockMatches.map((m) => ({
    price_date: m.date || m.price_date,
    modal_price: m.modalPrice || m.modal_price,
    source: m.source,
  }));
};

/**
 * Arbitrage Opportunity Finder across Mandis
 */
const getArbitrageOpportunities = async ({ crop }) => {
  if (!crop) crop = 'Tomato';
  const prices = await getMandiPrices({ crop, limit: 50 });

  if (prices.length === 0) return { best_mandi: null, spread: 0, mandis: [] };

  const sorted = [...prices].sort((a, b) => (b.modalPrice || b.modal_price) - (a.modalPrice || a.modal_price));
  const bestMandi = sorted[0];
  const lowestMandi = sorted[sorted.length - 1];
  const avgModal = Math.round(sorted.reduce((acc, p) => acc + (p.modalPrice || p.modal_price), 0) / sorted.length);
  const spreadPerQuintal = (bestMandi.modalPrice || bestMandi.modal_price) - (lowestMandi.modalPrice || lowestMandi.modal_price);

  return {
    crop_type: crop,
    best_mandi: {
      market_name: bestMandi.market || bestMandi.market_name,
      state: bestMandi.state,
      modal_price: bestMandi.modalPrice || bestMandi.modal_price,
      source: bestMandi.source,
      isLive: bestMandi.isLive,
    },
    lowest_mandi: {
      market_name: lowestMandi.market || lowestMandi.market_name,
      state: lowestMandi.state,
      modal_price: lowestMandi.modalPrice || lowestMandi.modal_price,
    },
    average_modal_price: avgModal,
    arbitrage_spread_per_qtl: spreadPerQuintal,
    profit_potential_on_10qtl: spreadPerQuintal * 10,
    top_mandis: sorted.slice(0, 6),
  };
};

module.exports = {
  fetchFromGovernmentApi,
  cachePricesInDatabase,
  normalizeCommodityForGovApi,
  getMandiPrices,
  getSingleCropPrice,
  getPriceTrend,
  getMockFallbackPrices,
  getArbitrageOpportunities,
  parseArrivalDate,
};
