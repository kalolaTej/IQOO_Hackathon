import React, { useState } from 'react';
import { generateSlipPDF } from '../../utils/pdfGenerator';

export const InstitutionalBids = () => {
  const [bids, setBids] = useState([
    { po: 'PO-2024-884', buyer: 'Maharshi Agro Exports', crop: 'Red Onion Grade A1', qty: '50.0 MT', maxPrice: '₹2,550 / Qtl', status: 'Active Procurement Bidding', bank: 'ICICI Escrow Locked' },
    { po: 'PO-2024-889', buyer: 'Reliance Retail Agritech', crop: 'Soybean (JS-335)', qty: '100.0 MT', maxPrice: '₹4,600 / Qtl', status: 'Direct Contract Open', bank: 'HDFC Escrow Locked' }
  ]);

  const [showPoModal, setShowPoModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);

  // New PO State
  const [newPo, setNewPo] = useState({
    crop: 'Red Onion Grade A1',
    qty: '',
    maxPrice: '',
    location: 'Pimpalgaon APMC Yard'
  });

  // Bid Offer State
  const [bidOffer, setBidOffer] = useState({
    bidPrice: '2540',
    qty: '24.0'
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [errors, setErrors] = useState({});

  const handleDownloadPoPDF = (b) => {
    generateSlipPDF({
      organization: 'INSTITUTIONAL PROCUREMENT EXCHANGE',
      title: 'INSTITUTIONAL PURCHASE ORDER & CONTRACT',
      subtitle: 'Verified APMC Escrow Procurement Agreement',
      referenceNo: b.po,
      dateTime: new Date().toLocaleString('en-IN'),
      fields: [
        { label: 'Purchase Order Ref', value: b.po },
        { label: 'Procurement Lead Agency', value: b.buyer },
        { label: 'Commodity Needed', value: b.crop },
        { label: 'Target Order Volume', value: b.qty },
        { label: 'Bank Escrow Guarantee', value: b.bank },
        { label: 'Contract Status', value: b.status }
      ],
      highlightResult: {
        label: 'MAXIMUM PURCHASE PRICE OFFER CAP',
        value: b.maxPrice,
        subtext: 'Escrow Funds Locked & Guaranteed'
      },
      footer: {
        operator: b.buyer,
        terminal: 'Procurement Exchange Node',
        location: 'AgriSync National APMC Network',
        disclaimer: 'Authenticated via ICICI Bank Escrow Smart Contract'
      }
    }, `Purchase_Order_${b.po}.pdf`);
  };

  const handleCreatePo = (e) => {
    e.preventDefault();
    const errs = {};
    if (!newPo.qty || isNaN(newPo.qty) || Number(newPo.qty) <= 0) {
      errs.qty = 'Enter a valid volume required in MT.';
    }
    if (!newPo.maxPrice || isNaN(newPo.maxPrice) || Number(newPo.maxPrice) <= 0) {
      errs.maxPrice = 'Enter a valid max price per quintal.';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const created = {
      po: `PO-2024-${Math.floor(890 + Math.random() * 100)}`,
      buyer: 'Institutional Procurement Lead',
      crop: newPo.crop,
      qty: `${Number(newPo.qty).toFixed(1)} MT`,
      maxPrice: `₹${Number(newPo.maxPrice).toLocaleString()} / Qtl`,
      status: 'Active Procurement Bidding',
      bank: 'Escrow Locked'
    };

    setBids([created, ...bids]);
    setShowPoModal(false);
    setNewPo({ crop: 'Red Onion Grade A1', qty: '', maxPrice: '', location: 'Pimpalgaon APMC Yard' });
    setErrors({});
  };

  const handleOpenBidModal = (po) => {
    setSelectedPo(po);
    setShowBidModal(true);
  };

  const handleSubmitBidOffer = (e) => {
    e.preventDefault();
    setShowBidModal(false);
    setToastMessage(`✓ Bid offer of ₹${bidOffer.bidPrice}/Qtl submitted for ${selectedPo.po}! Buyer notified.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="p-4 bg-[#dcfce7] border-2 border-[#bbf7d0] text-[#15803d] rounded-2xl text-xs font-extrabold shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">Buyer Procurement Terminal</span>
          <h1 className="text-2xl font-black text-[#0f172a]">Institutional Bids & Purchase Orders</h1>
        </div>
        <button 
          onClick={() => setShowPoModal(true)}
          className="px-4 py-2.5 bg-[#047857] text-white rounded-xl text-xs font-extrabold shadow-md hover:bg-[#065f46] transition-colors flex items-center gap-1.5 w-fit cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>+ Create Purchase Order</span>
        </button>
      </div>

      <div className="space-y-4">
        {bids.map((b, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[#0f172a] text-base">{b.buyer}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[10px] font-extrabold border border-[#bbf7d0]">{b.po}</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">{b.crop} • Volume Wanted: <strong>{b.qty}</strong> • {b.bank}</div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-xl font-black text-[#0f172a] font-data-tabular">{b.maxPrice}</div>
                <div className="text-[10px] text-[#047857] font-bold">{b.status}</div>
              </div>
              <button 
                onClick={() => handleDownloadPoPDF(b)}
                className="px-3.5 py-2 bg-white text-[#047857] border border-[#047857] rounded-xl text-xs font-bold hover:bg-[#dcfce7] transition-colors shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">download</span> PDF PO
              </button>
              <button 
                onClick={() => handleOpenBidModal(b)}
                className="px-4 py-2 bg-[#0f172a] text-white rounded-xl text-xs font-bold hover:bg-[#1e293b] transition-colors shadow-xs cursor-pointer active:scale-98"
              >
                Place Bid Offer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Purchase Order Modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#047857] text-2xl">shopping_bag</span>
                <h2 className="text-lg font-black text-[#0f172a]">Create Institutional Purchase Order</h2>
              </div>
              <button onClick={() => setShowPoModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Crop Commodity Variety *</label>
                <select 
                  value={newPo.crop}
                  onChange={(e) => setNewPo({...newPo, crop: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                >
                  <option value="Red Onion Grade A1">Red Onion Grade A1</option>
                  <option value="Soybean (JS-335 FAQ)">Soybean (JS-335 FAQ)</option>
                  <option value="Tomato (Hybrid Grade A)">Tomato (Hybrid Grade A)</option>
                  <option value="Pomegranate (Bhagwa Export)">Pomegranate (Bhagwa Export)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Required Volume (MT) *</label>
                  <input 
                    type="number"
                    step="1"
                    placeholder="e.g. 50"
                    value={newPo.qty}
                    onChange={(e) => setNewPo({...newPo, qty: e.target.value})}
                    className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none focus:border-[#047857]"
                  />
                  {errors.qty && <span className="text-red-600 text-[10px] font-bold mt-0.5 block">{errors.qty}</span>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Price (₹ / Qtl) *</label>
                  <input 
                    type="number"
                    placeholder="e.g. 2550"
                    value={newPo.maxPrice}
                    onChange={(e) => setNewPo({...newPo, maxPrice: e.target.value})}
                    className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none focus:border-[#047857]"
                  />
                  {errors.maxPrice && <span className="text-red-600 text-[10px] font-bold mt-0.5 block">{errors.maxPrice}</span>}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Mandi Yard / Warehouse</label>
                <input 
                  type="text"
                  value={newPo.location}
                  onChange={(e) => setNewPo({...newPo, location: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowPoModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#047857] text-white font-extrabold rounded-xl hover:bg-[#065f46] shadow-md"
                >
                  + Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Place Bid Offer Modal */}
      {showBidModal && selectedPo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#047857] uppercase">Bid Offer Submission</span>
                <h2 className="text-base font-black text-[#0f172a]">{selectedPo.buyer} ({selectedPo.po})</h2>
              </div>
              <button onClick={() => setShowBidModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitBidOffer} className="space-y-4 text-xs">
              <div className="p-3 bg-[#f0fdf4] rounded-xl border border-[#dcfce7] space-y-1">
                <div className="flex justify-between font-bold"><span>Commodity Needed:</span> <span>{selectedPo.crop}</span></div>
                <div className="flex justify-between font-bold"><span>Buyer Max Cap:</span> <span className="text-[#047857]">{selectedPo.maxPrice}</span></div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Price Bid Offer (₹ / Qtl) *</label>
                <input 
                  type="number"
                  value={bidOffer.bidPrice}
                  onChange={(e) => setBidOffer({...bidOffer, bidPrice: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-black text-[#0f172a] font-data-tabular outline-none focus:border-[#047857]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Offered Batch Weight (MT) *</label>
                <input 
                  type="number"
                  step="0.5"
                  value={bidOffer.qty}
                  onChange={(e) => setBidOffer({...bidOffer, qty: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none focus:border-[#047857]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowBidModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#047857] text-white font-extrabold rounded-xl hover:bg-[#065f46] shadow-md"
                >
                  Submit Competitive Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionalBids;
