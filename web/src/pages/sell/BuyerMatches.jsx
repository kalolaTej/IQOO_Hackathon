import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, ShieldCheck, ArrowRight, Sliders } from 'lucide-react';

export const BuyerMatches = () => {
  const navigate = useNavigate();
  const [buyers] = useState([
    {
      id: 'BUY-01',
      name: 'Maharshi Agro Exports Ltd.',
      price: '2,520',
      unitPrice: 2520,
      qty: '24.0 MT',
      matchScore: '94% Match',
      matchDetails: 'Direct Match: Crop Grade A + 24 MT Volume + Zero Commission',
      terms: 'Simulated Escrow • Zero Commission',
      location: 'Pimpalgaon APMC Yard',
      badge: 'Verified Exporter'
    },
    {
      id: 'BUY-02',
      name: 'Reliance Retail Agritech',
      price: '2,480',
      unitPrice: 2480,
      qty: '15.0 MT',
      matchScore: '88% Match',
      matchDetails: 'Location Match: Farmgate Pickup + Immediate Dispatch',
      terms: 'Direct Farmgate Pickup',
      location: 'Niphad Warehouse',
      badge: 'Corporate Buyer'
    },
    {
      id: 'BUY-03',
      name: 'Sahyadri Farmers Producer Co.',
      price: '2,450',
      unitPrice: 2450,
      qty: '30.0 MT',
      matchScore: '85% Match',
      matchDetails: 'FPO Collective Pool • Bulk Trade Rate',
      terms: 'FPO Pool Escrow',
      location: 'Nashik Mandi',
      badge: 'FPO Federation'
    }
  ]);

  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [contractForm, setContractForm] = useState({
    bankAccount: '9100238491823',
    ifsc: 'ICIC0000102',
    signature: 'Rajesh Tukaram Patil',
    agreedTerms: false
  });

  const [errors, setErrors] = useState({});

  const handleOpenContractModal = (buyer) => {
    setSelectedBuyer(buyer);
    setShowModal(true);
    setErrors({});
  };

  const handleExecuteContract = (e) => {
    e.preventDefault();
    const errs = {};
    if (!contractForm.bankAccount || contractForm.bankAccount.length < 8) {
      errs.bankAccount = 'Valid bank account number required.';
    }
    if (!contractForm.signature.trim()) {
      errs.signature = 'Digital signature text is required.';
    }
    if (!contractForm.agreedTerms) {
      errs.agreedTerms = 'You must accept the simulated escrow terms.';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setShowModal(false);
    navigate('/transactions');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">Commerce & Institutional Trade</span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
            WEIGHTED RULE-BASED BUYER MATCHING
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0f172a]">Verified Buyer Offers & Direct Contracts</h1>
        <p className="text-xs text-slate-600 mt-1">
          Direct institutional procurement matches prioritized via weighted multi-criteria rule scoring (crop grade, location distance, volume parity, and settlement guarantee).
        </p>
      </div>

      {/* Buyer Cards */}
      <div className="space-y-4">
        {buyers.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-base text-[#0f172a]">{b.name}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                  {b.badge}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black font-mono">
                  {b.matchScore}
                </span>
              </div>

              <p className="text-[11px] text-[#047857] font-semibold">{b.matchDetails}</p>

              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-0.5">
                <span>📍 {b.location}</span>
                <span>•</span>
                <span>🔒 {b.terms}</span>
              </div>
            </div>

            <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="text-left md:text-right">
                <div className="text-xl font-black text-[#0f172a] font-data-tabular">₹{b.price} / Qtl</div>
                <div className="text-[11px] text-[#047857] font-bold">Requirement: {b.qty}</div>
              </div>

              <button
                onClick={() => handleOpenContractModal(b)}
                className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer active:scale-98"
              >
                Accept Contract & Execute
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Contract Execution Form Modal */}
      {showModal && selectedBuyer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#047857] uppercase">Electronic Sauda Contract</span>
                <h2 className="text-lg font-black text-[#0f172a]">{selectedBuyer.name}</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteContract} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contracted Produce:</span>
                  <strong>Red Onion Garwa ({selectedBuyer.qty})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Agreed Price:</span>
                  <strong className="text-[#047857]">₹{selectedBuyer.price} / Qtl</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Settlement Value:</span>
                  <strong className="font-data-tabular">₹5,80,800.00</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Farmer Bank Account Number *</label>
                <input
                  type="text"
                  value={contractForm.bankAccount}
                  onChange={(e) => setContractForm({ ...contractForm, bankAccount: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#0f172a] outline-none"
                />
                {errors.bankAccount && <span className="text-red-600 text-[10px] font-bold mt-0.5 block">{errors.bankAccount}</span>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank IFSC Code *</label>
                <input
                  type="text"
                  value={contractForm.ifsc}
                  onChange={(e) => setContractForm({ ...contractForm, ifsc: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#0f172a] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Digital Signature Text *</label>
                <input
                  type="text"
                  value={contractForm.signature}
                  onChange={(e) => setContractForm({ ...contractForm, signature: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                />
                {errors.signature && <span className="text-red-600 text-[10px] font-bold mt-0.5 block">{errors.signature}</span>}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck size={13} /> SIMULATED ESCROW SETTLEMENT NODE
                </div>
                <p className="text-[10px] text-amber-700">
                  By accepting, this trade agreement is registered in the simulated escrow ledger. No physical banking API switch or real bank transfer is initiated.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={contractForm.agreedTerms}
                  onChange={(e) => setContractForm({ ...contractForm, agreedTerms: e.target.checked })}
                  className="w-4 h-4 rounded text-[#047857] cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-slate-700 font-semibold cursor-pointer">
                  I accept the contract specifications and simulated escrow ledger terms.
                </label>
              </div>
              {errors.agreedTerms && <span className="text-red-600 text-[10px] font-bold block">{errors.agreedTerms}</span>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#047857] hover:bg-[#065f46] text-white font-extrabold rounded-xl shadow-md cursor-pointer active:scale-98"
                >
                  Execute & View Settlement Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerMatches;
