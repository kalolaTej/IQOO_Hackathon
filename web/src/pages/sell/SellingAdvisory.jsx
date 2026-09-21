import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Calendar,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Building,
  Navigation,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';

export const SellingAdvisory = () => {
  const [searchParams] = useSearchParams();
  const queryLotId = searchParams.get('lotId') || 'LOT-2024-098';
  const queryCrop = searchParams.get('crop') || 'Red Onion (Garwa)';
  const queryQty = searchParams.get('qty') || '24.0 MT';

  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const backendUrl = API_BASE_URL;

  const fetchAdvisory = useCallback(async () => {
    try {
      const res = await fetch(
        `${backendUrl}/api/sale-window?crop=${encodeURIComponent(queryCrop)}&quantity_kg=${encodeURIComponent(queryQty)}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json) setAdvisory(json);
      }
    } catch (err) {
      console.warn('Could not fetch advisory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [backendUrl, queryCrop, queryQty]);

  useEffect(() => {
    fetchAdvisory();
  }, [fetchAdvisory]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdvisory();
  };

  const currentPrice = advisory?.current_modal_price || 2420;
  const projectedPrice = advisory?.projected_modal_price || 2540;
  const grossRealization = advisory?.estimated_gross_realization || 609600;
  const recommendation = advisory?.recommendation || 'sell_now';
  const isHold = recommendation === 'hold';
  const isLive = Boolean(advisory?.isLive);
  const isCached = Boolean(advisory?.isCached);
  const trendPct = advisory?.price_trend_pct !== undefined ? advisory.price_trend_pct : 6.2;
  const recommendedMarket = advisory?.recommendedMarket || {
    name: 'Pimpalgaon APMC',
    distanceKm: 14,
    modalPrice: currentPrice,
    minPrice: Math.round(currentPrice * 0.9),
    maxPrice: Math.round(currentPrice * 1.1),
    priceDate: new Date().toISOString().split('T')[0],
    isLive: true,
  };
  const alternatives = advisory?.alternatives || [];
  const farmerLocation = advisory?.farmerLocation || {
    farmName: 'Registered Farmland',
    location: 'Primary Field Location',
    district: 'Local District',
    state: 'State',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">Commerce & Market Intelligence</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
              LOCATION-AWARE SELLING ADVISORY
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0f172a] mt-1">Smart Mandi Selling Advisory</h1>
          <p className="text-xs text-slate-600 mt-1">
            Algorithmic recommendation comparing nearby mandis from your farm location ({farmerLocation.farmName}), official data.gov.in rates, and certified crop grade.
          </p>
        </div>

        {/* Data Source Badge & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black">
              <CheckCircle2 size={14} className="text-emerald-700" />
              <span>LIVE • data.gov.in</span>
            </span>
          ) : isCached ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 border border-blue-300 text-xs font-black">
              <Info size={14} className="text-blue-700" />
              <span>CACHED • data.gov.in</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black"
              title={advisory?.fallbackReason || 'Official live data unavailable'}
            >
              <AlertTriangle size={14} className="text-amber-700" />
              <span>DUMMY • Live data unavailable</span>
            </span>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Advisory & Market Data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#047857]' : ''} />
          </button>
        </div>
      </div>

      {/* Main Advisory Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#047857]">
                Target Batch: #{queryLotId} ({queryQty} {queryCrop})
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black border border-emerald-300">
                Grade {advisory?.grade || 'A'} Certified
              </span>
            </div>
            <h2 className="text-xl font-black text-[#0f172a] mt-0.5">
              Recommended Window: {isHold ? `Hold for next ${advisory?.hold_days || 3} days` : 'Immediate Execution (Next 48–72 Hours)'}
            </h2>
          </div>
          <span
            className={`px-4 py-2 rounded-xl text-white text-xs font-black shadow-xs shrink-0 ${
              isHold ? 'bg-blue-600' : 'bg-[#047857]'
            }`}
          >
            DECISION: {isHold ? 'HOLD BATCH' : 'SELL NOW'} ({trendPct > 0 ? `+${trendPct}%` : `${trendPct}%`} Trend)
          </span>
        </div>

        {/* Farmer Location Banner */}
        <div className="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin size={16} className="text-[#047857] shrink-0" />
            <span>
              Farmer Location: <strong className="text-slate-900">{farmerLocation.farmName}</strong> ({farmerLocation.location}, {farmerLocation.district}, {farmerLocation.state})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Updated: {new Date(advisory?.generatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 space-y-1">
            <div className="text-xs text-slate-500 font-bold uppercase">
              {recommendedMarket.name} (Suggested)
            </div>
            <div className="text-2xl font-black text-[#0f172a] font-data-tabular">
              ₹{currentPrice.toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">/ Qtl</span>
            </div>
            <div className="text-xs text-[#15803d] font-bold flex items-center gap-1">
              <span>Current Modal Rate</span>
              {isLive ? (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">Live</span>
              ) : (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-mono">Fallback</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 space-y-1">
            <div className="text-xs text-slate-500 font-bold uppercase">Projected Window Target</div>
            <div className="text-2xl font-black text-[#0f172a] font-data-tabular">
              ₹{projectedPrice.toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">/ Qtl</span>
            </div>
            <div className="text-xs text-[#15803d] font-bold">
              {projectedPrice >= currentPrice
                ? `+₹${(projectedPrice - currentPrice).toLocaleString('en-IN')} Net Upside / Qtl`
                : `Secures current rates`}
            </div>
          </div>

          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 space-y-1">
            <div className="text-xs text-slate-500 font-bold uppercase">Estimated Gross Realization</div>
            <div className="text-2xl font-black text-[#0f172a] font-data-tabular">
              ₹{grossRealization.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 font-bold">Total Batch Realization</div>
          </div>
        </div>

        {/* Suggested Market Recommendation Details Box */}
        <div className="p-5 bg-[#0f172a] text-white rounded-2xl text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="font-black text-[#dcfce7] flex items-center gap-1.5 text-sm">
              <Navigation size={16} className="text-[#a7f3d0]" />
              <span>Suggested Market: {recommendedMarket.name} (~{recommendedMarket.distanceKm} km)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-[10px]">
              {advisory?.advantage || 'Optimal Net Realization'}
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <p className="font-bold text-white">Why this market:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-300">
              <li>Current modal price: <strong className="text-white">₹{recommendedMarket.modalPrice}/quintal</strong></li>
              <li>Estimated distance from your farm: <strong className="text-white">{recommendedMarket.distanceKm} km</strong></li>
              <li>Certified crop grade evaluated: <strong className="text-emerald-400">Grade {advisory?.grade || 'A'}</strong></li>
              <li>Data Source: <strong className="text-slate-200">{recommendedMarket.priceSource || 'data.gov.in'}</strong></li>
              <li>Market Data Date: <strong className="text-slate-200">{recommendedMarket.priceDate || new Date().toISOString().split('T')[0]}</strong></li>
            </ul>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed pt-1 border-t border-slate-800">
            {advisory?.reason || advisory?.rationale}
          </p>
        </div>

        {/* Location-Wise Nearby Mandis Comparison Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0f172a] flex items-center gap-1.5">
              <Building size={16} className="text-[#047857]" />
              <span>Nearby APMC Mandi Comparison</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Ranked by proximity & net realization</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase">
                <tr>
                  <th className="p-3 pl-4">Mandi Market</th>
                  <th className="p-3">Est. Distance</th>
                  <th className="p-3">Modal Price</th>
                  <th className="p-3">Min / Max</th>
                  <th className="p-3">Data Date</th>
                  <th className="p-3 pr-4">Data Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr className="bg-emerald-50/40 font-semibold">
                  <td className="p-3 pl-4">
                    <span className="font-black text-[#0f172a] block">{recommendedMarket.name}</span>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">★ Suggested Market</span>
                  </td>
                  <td className="p-3 font-mono">{recommendedMarket.distanceKm} km</td>
                  <td className="p-3 font-black text-emerald-800 font-data-tabular">₹{recommendedMarket.modalPrice}/q</td>
                  <td className="p-3 text-slate-500 font-data-tabular">₹{recommendedMarket.minPrice} - ₹{recommendedMarket.maxPrice}</td>
                  <td className="p-3 text-slate-500">{recommendedMarket.priceDate}</td>
                  <td className="p-3 pr-4">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {isLive ? 'LIVE • data.gov.in' : 'CACHED'}
                    </span>
                  </td>
                </tr>

                {alternatives.map((alt, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 text-slate-700">
                    <td className="p-3 pl-4 font-bold text-[#0f172a]">{alt.name}</td>
                    <td className="p-3 font-mono text-slate-500">{alt.distanceKm} km</td>
                    <td className="p-3 font-bold text-slate-800 font-data-tabular">₹{alt.modalPrice}/q</td>
                    <td className="p-3 text-slate-500 font-data-tabular">₹{alt.minPrice} - ₹{alt.maxPrice}</td>
                    <td className="p-3 text-slate-500">{alt.priceDate}</td>
                    <td className="p-3 pr-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {alt.isLive ? 'LIVE' : 'CACHED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <Link
            to="/produce"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            ← Back to My Produce
          </Link>

          <Link
            to={`/market?crop=${encodeURIComponent(queryCrop)}`}
            className="px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Explore All Regional Mandis</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellingAdvisory;
