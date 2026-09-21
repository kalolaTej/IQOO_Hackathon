const { getMandiPrices } = require('../services/agmarknetService');

exports.getMandiPrices = async (req, res) => {
  try {
    const { crop, state, district, market, limit } = req.query;
    const prices = await getMandiPrices({
      crop,
      state,
      district,
      market,
      limit: parseInt(limit, 10) || 50,
    });

    const isLive = prices.some((p) => p.isLive);
    const isCached = prices.some((p) => p.isCached);

    return res.status(200).json({
      success: true,
      available: true,
      source: isLive ? 'data.gov.in' : (isCached ? 'data.gov.in (Cached)' : 'labeled_fallback'),
      isLive,
      count: prices.length,
      data: prices,
    });
  } catch (error) {
    console.error('Error in mandi price endpoint:', error);
    return res.status(500).json({ error: 'Failed to retrieve mandi information.' });
  }
};
