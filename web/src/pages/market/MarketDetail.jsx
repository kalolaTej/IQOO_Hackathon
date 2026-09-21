import React from 'react';
import { Link } from 'react-router-dom';

export const MarketDetail = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold text-[#047857] uppercase tracking-wider">APMC Profile & Historical Analytics</span>
          <h1 className="text-2xl font-black text-[#0f172a]">Pimpalgaon APMC Mandi Market Detail</h1>
        </div>
        <Link to="/market" className="px-3.5 py-1.5 bg-slate-100 text-[#0f172a] border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200">
          ← Back to All Mandis
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold">Today's Total Arrival</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1 font-data-tabular">14,200 Qtl</div>
          <div className="text-xs text-[#15803d] font-bold mt-1">Onion & Tomato Heavy</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold">Current Modal Rate</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1 font-data-tabular">₹2,420 / Qtl</div>
          <div className="text-xs text-[#15803d] font-bold mt-1">+6.2% Weekly Rise</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold">Active Traders Registered</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1 font-data-tabular">184 Traders</div>
          <div className="text-xs text-slate-600 font-bold mt-1">100% License Verified</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-500 font-semibold">Live Gate Queue</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1 font-data-tabular">12 Vehicles</div>
          <div className="text-xs text-[#047857] font-bold mt-1">~40 min wait</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-[#0f172a]">7-Day Modal Price History (Red Onion Garwa)</h3>
        <div className="h-44 bg-[#f0fdf4] rounded-xl border border-[#dcfce7] flex items-end justify-between p-6 gap-2">
          <div className="flex-1 bg-[#166534] rounded-t-lg h-[65%] text-center text-white text-[10px] pt-1">₹2,280</div>
          <div className="flex-1 bg-[#166534] rounded-t-lg h-[70%] text-center text-white text-[10px] pt-1">₹2,310</div>
          <div className="flex-1 bg-[#166534] rounded-t-lg h-[72%] text-center text-white text-[10px] pt-1">₹2,340</div>
          <div className="flex-1 bg-[#166534] rounded-t-lg h-[75%] text-center text-white text-[10px] pt-1">₹2,360</div>
          <div className="flex-1 bg-[#166534] rounded-t-lg h-[82%] text-center text-white text-[10px] pt-1">₹2,390</div>
          <div className="flex-1 bg-[#166534] rounded-t-lg h-[88%] text-center text-white text-[10px] pt-1">₹2,400</div>
          <div className="flex-1 bg-[#047857] rounded-t-lg h-[100%] text-center text-white text-[10px] font-black pt-1">₹2,420</div>
        </div>
        <div className="flex justify-between text-[11px] text-slate-600 font-bold px-2">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span className="text-[#047857] font-black">Today</span>
        </div>
      </div>
    </div>
  );
};

export default MarketDetail;
