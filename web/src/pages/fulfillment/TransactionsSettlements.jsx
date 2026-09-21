import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, FileText, CheckCircle2, DollarSign } from 'lucide-react';

const TRANSACTIONS_DATA = [
  {
    id: 'SAUDA-2024-8842',
    lotId: 'LOT-2024-098',
    buyer: 'Maharshi Agro Exports Ltd.',
    crop: 'Red Onion Garwa',
    quantity: '24.0 MT (240 Qtl)',
    unitPrice: '₹2,420 / Qtl',
    grossAmount: '₹5,80,800',
    deductions: '₹0.00 (Zero APMC Fee)',
    netAmount: '₹5,80,800',
    procurementStatus: 'Procured & Weighed',
    paymentStatus: 'Escrow Funded',
    settlementStatus: 'Settled (Simulated Node)',
    date: '18 Sep 2026',
    reference: 'UTR981240182'
  },
  {
    id: 'SAUDA-2024-8710',
    lotId: 'LOT-2024-102',
    buyer: 'Reliance Retail Agritech',
    crop: 'Soybean (JS-335)',
    quantity: '12.5 MT (125 Qtl)',
    unitPrice: '₹4,520 / Qtl',
    grossAmount: '₹5,65,000',
    deductions: '₹0.00 (Direct Purchase)',
    netAmount: '₹5,65,000',
    procurementStatus: 'Delivered',
    paymentStatus: 'Escrow Funded',
    settlementStatus: 'Settled (Simulated Node)',
    date: '04 Sep 2026',
    reference: 'UTR981240102'
  },
  {
    id: 'SAUDA-2024-8622',
    lotId: 'LOT-2024-105',
    buyer: 'Pimpalgaon APMC Trader #42',
    crop: 'Tomato (Hybrid)',
    quantity: '8.0 MT (80 Qtl)',
    unitPrice: '₹1,850 / Qtl',
    grossAmount: '₹1,48,000',
    deductions: '₹0.00 (Standard FAQ)',
    netAmount: '₹1,48,000',
    procurementStatus: 'Completed',
    paymentStatus: 'Escrow Funded',
    settlementStatus: 'Settled (Simulated Node)',
    date: '28 Aug 2026',
    reference: 'UTR981240091'
  }
];

export const TransactionsSettlements = () => {
  const [transactions] = useState(TRANSACTIONS_DATA);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">Fulfillment & Settlement Ledger</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
              SIMULATED ESCROW SETTLEMENT NODE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mt-1">Transactions & Mandi Settlements</h1>
          <p className="text-xs text-slate-600 mt-1">
            State-machine escrow settlement records, verified trade slips, and transparent procurement vouchers.
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs text-left sm:text-right">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Season Settlements</div>
          <div className="text-xl font-black text-[#0f172a] font-data-tabular">₹12,93,800</div>
          <div className="text-[10px] text-emerald-700 font-bold">3 Completed Trades</div>
        </div>
      </div>

      {/* Simulated Node Notice */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck size={18} className="text-[#047857] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Escrow Simulation Environment:</strong> Ledger transitions mimic automated commercial escrow fund release. No physical bank API switch or live NPCI transfer is executed.
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 shrink-0">Node: ESCROW-MANDI-SIM-01</span>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {transactions.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono font-black text-[#047857] text-xs">#{t.id}</div>
                <div className="text-[10px] text-slate-500 font-mono">Lot: {t.lotId}</div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                <CheckCircle2 size={10} /> {t.settlementStatus}
              </span>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Buyer:</span>
                <span className="font-bold text-slate-900 text-right">{t.buyer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Crop & Qty:</span>
                <span className="font-medium text-slate-800 text-right">{t.crop} ({t.quantity})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit Rate:</span>
                <span className="font-semibold text-slate-800 font-data-tabular">{t.unitPrice}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Net Settlement:</span>
                <span className="font-black text-base text-[#047857] font-data-tabular">{t.netAmount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">{t.date}</span>
              <Link
                to={`/transactions/${t.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <FileText size={13} />
                <span>View Slip</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-[#dcfce7] text-[11px] font-extrabold uppercase tracking-wider">
                <th className="p-4">Transaction & Lot ID</th>
                <th className="p-4">Buyer / Agency</th>
                <th className="p-4">Quantity & Price</th>
                <th className="p-4">Gross & Net Amount</th>
                <th className="p-4">Procurement Status</th>
                <th className="p-4">Settlement State</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-[#0f172a]">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 font-medium transition-colors">
                  {/* Transaction ID & Lot */}
                  <td className="p-4">
                    <div className="font-mono font-black text-[#047857] text-xs">#{t.id}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Lot: {t.lotId}</div>
                  </td>

                  {/* Buyer */}
                  <td className="p-4 font-bold text-slate-900">{t.buyer}</td>

                  {/* Quantity & Unit Price */}
                  <td className="p-4">
                    <div className="font-semibold">{t.crop}</div>
                    <div className="text-[11px] text-slate-500 font-data-tabular">
                      {t.quantity} @ {t.unitPrice}
                    </div>
                  </td>

                  {/* Gross & Net */}
                  <td className="p-4">
                    <div className="font-black text-sm text-[#0f172a] font-data-tabular">{t.netAmount}</div>
                    <div className="text-[10px] text-slate-500">Gross: {t.grossAmount} • Ded: {t.deductions}</div>
                  </td>

                  {/* Procurement Status */}
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {t.procurementStatus}
                    </span>
                  </td>

                  {/* Settlement State */}
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      <CheckCircle2 size={11} /> {t.settlementStatus}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="p-4 text-slate-500 whitespace-nowrap">{t.date}</td>

                  {/* Action */}
                  <td className="p-4 text-right pr-6">
                    <Link
                      to={`/transactions/${t.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
                    >
                      <FileText size={13} />
                      <span>View Slip</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionsSettlements;
