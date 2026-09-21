import React from 'react';

export const DesignSystemTokens = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0f172a]">AgriCore Operational Design System Tokens</h1>
        <p className="text-xs text-slate-600 mt-1">Official Green-White color palette, typography standards, and component token specifications.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-[#166534] text-white rounded-2xl p-6 shadow-md border border-[#14532d]">
          <div className="text-xs font-bold uppercase tracking-wider text-[#dcfce7]">Primary Forest Green</div>
          <div className="text-2xl font-black mt-2 font-data-tabular">#166534</div>
          <p className="text-xs text-[#dcfce7] mt-2">Brand headers, main application badges, primary indicators.</p>
        </div>

        <div className="bg-[#047857] text-white rounded-2xl p-6 shadow-md border border-[#065f46]">
          <div className="text-xs font-bold uppercase tracking-wider text-white">Primary Button Emerald</div>
          <div className="text-2xl font-black mt-2 font-data-tabular">#047857</div>
          <p className="text-xs text-white/90 mt-2">Call to action buttons, gate token actions, key highlights.</p>
        </div>

        <div className="bg-[#dcfce7] text-[#15803d] rounded-2xl p-6 shadow-md border border-[#bbf7d0]">
          <div className="text-xs font-bold uppercase tracking-wider text-[#15803d]">Light Mint Pill / Badge</div>
          <div className="text-2xl font-black mt-2 font-data-tabular">#DCFCE7</div>
          <p className="text-xs text-[#15803d] mt-2">Verified badges, confirmed token backgrounds, status pills.</p>
        </div>

        <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Dark Slate Shell</div>
          <div className="text-2xl font-black mt-2 font-data-tabular">#0F172A</div>
          <p className="text-xs text-slate-300 mt-2">Sidebar background, high-contrast tables, header bars.</p>
        </div>
      </div>
    </div>
  );
};

export default DesignSystemTokens;
