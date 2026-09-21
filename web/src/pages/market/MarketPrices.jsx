import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, RefreshCw, Search, ArrowRight, ShieldCheck, Database, CheckCircle2, AlertTriangle } from 'lucide-react';

export const MarketPrices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('All');
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const backendUrl = API_BASE_URL;

  const fetchLivePrices = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedCropFilter !== 'All'
        ? `${backendUrl}/api/market-prices?crop=${encodeURIComponent(selectedCropFilter)}&limit=50`
        : `${backendUrl}/api/market-prices?limit=50`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data || [];
        setPrices(items);
      }
    } catch (err) {
      console.warn('Failed to fetch mandi prices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [backendUrl, selectedCropFilter]);

  useEffect(() => {
    fetchLivePrices();
  }, [fetchLivePrices]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLivePrices();
  };

  const filtered = prices.filter((p) => {
    const cropText = (p.crop || p.crop_type || '').toLowerCase();
    const marketText = (p.market || p.market_name || '').toLowerCase();
    const stateText = (p.state || '').toLowerCase();
    const query = searchTerm.toLowerCase().trim();

    return cropText.includes(query) || marketText.includes(query) || stateText.includes(query);
  });

  const hasLiveGovernmentData = prices.some((p) => p.isLive === true || p.source === 'data.gov.in');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">APMC Mandi Intelligence</span>
            {hasLiveGovernmentData ? (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>OFFICIAL data.gov.in ACTIVE</span>
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>MOCK REGISTRY ACTIVE</span>
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mt-0.5">Agmarknet Mandi Market Prices</h1>
          <p className="text-xs text-slate-600 mt-1">
            Real-time daily modal rates and arrival metrics synchronized from official data.gov.in Agmarknet mandi portal.
          </p>
        </div>

        {/* Search & Refresh Controls */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:w-64 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search crop or APMC mandi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8.5 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#0f172a] outline-none shadow-2xs focus:border-[#047857] min-h-[38px]"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-1 min-h-[38px] min-w-[38px] cursor-pointer shrink-0"
            title="Refresh latest mandi quotes"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#047857]' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Quick Pills */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs">
        {['All', 'Onion', 'Tomato', 'Wheat', 'Soybean', 'Potato', 'Pomegranate', 'Grapes'].map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCropFilter(c)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer min-h-[34px] ${
              selectedCropFilter === c
                ? 'bg-[#047857] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c === 'All' ? 'All Commodities' : c}
          </button>
        ))}
      </div>

      {/* Grid of Mandi Prices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-6 bg-slate-200 rounded w-1/2"></div>
              <div className="h-10 bg-slate-100 rounded"></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 text-slate-500 space-y-2 p-6">
            <Search size={32} className="mx-auto text-slate-400" />
            <p className="font-bold text-sm">No mandi quotes found matching "{searchTerm}"</p>
            <p className="text-xs text-slate-400">Try searching for Onion, Tomato, Wheat, or Nashik.</p>
          </div>
        ) : (
          filtered.map((item, idx) => {
            const cropName = item.crop || item.crop_type || 'Commodity';
            const marketName = item.market || item.market_name || 'APMC Mandi';
            const stateName = item.state || 'India';
            const modal = item.modalPrice || item.modal_price || 0;
            const min = item.minPrice || item.min_price || Math.round(modal * 0.85);
            const max = item.maxPrice || item.max_price || Math.round(modal * 1.15);
            const dateStr = item.date || item.price_date || new Date().toISOString().split('T')[0];
            const isItemLive = item.isLive === true || item.source === 'data.gov.in';

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 sm:space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                      {stateName}
                    </span>
                    {isItemLive ? (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        <span>LIVE • data.gov.in</span>
                      </span>
                    ) : (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300 flex items-center gap-1" title={item.fallbackReason || 'Demo data'}>
                        <AlertTriangle size={11} />
                        <span>⚠ DUMMY DATA</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <h2 className="text-base font-black text-[#0f172a]">{cropName}</h2>
                    <p className="text-xs text-slate-600 font-semibold">{marketName}</p>
                  </div>

                  <div className="mt-3 p-3 sm:p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-bold">Modal Rate:</span>
                      <span className="text-lg sm:text-xl font-black text-[#0f172a] font-data-tabular">
                        ₹{modal.toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">/ Qtl</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Min: <strong className="text-slate-800 font-bold">₹{min.toLocaleString('en-IN')}</strong></span>
                      <span>Max: <strong className="text-slate-800 font-bold">₹{max.toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                    {dateStr}
                  </span>
                  <Link
                    to={`/sell/advisory?crop=${encodeURIComponent(cropName)}&qty=1000`}
                    className="text-[#047857] hover:text-[#065f46] font-extrabold flex items-center gap-1 hover:underline min-h-[32px]"
                  >
                    <span>Sell Advisory</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MarketPrices;
