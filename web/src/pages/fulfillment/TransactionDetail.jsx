import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, ArrowLeft, ShieldCheck, CheckCircle2, FileText, Building2, UserCheck } from 'lucide-react';
import { generateSlipPDF } from '../../utils/pdfGenerator';

export const TransactionDetail = () => {
  const { id } = useParams();
  const [downloading, setDownloading] = useState(false);

  const txData = {
    id: id || 'SAUDA-2024-8842',
    lotId: 'LOT-2024-098',
    seller: 'Rajesh Tukaram Patil (FPO Member #FPO-9182)',
    buyer: 'Maharshi Agro Exports Ltd.',
    commodity: 'Red Onion Garwa (FAQ Export Grade)',
    quantity: '24.0 MT (240.0 Quintals)',
    unitPrice: '₹2,420.00 / Qtl',
    grossAmount: '₹5,80,800.00',
    deductions: '₹0.00 (Standard FAQ Zero Deduction)',
    netAmount: '₹5,80,800.00',
    procurementStatus: 'Procured & Certified on Weighbridge Scale #1',
    paymentStatus: 'Escrow Funded (Simulation)',
    settlementStatus: 'Settled (Simulated Node)',
    reference: 'UTR981240182',
    date: new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    generateSlipPDF(
      {
        organization: 'AGRISYNC MANDI PROCUREMENT & SETTLEMENT NETWORK',
        title: 'ELECTRONIC SAUDA SLIP & SETTLEMENT RECORD',
        subtitle: 'Digital Escrow Settlement Voucher',
        referenceNo: txData.id,
        dateTime: new Date().toLocaleString('en-IN'),
        fields: [
          { label: 'Transaction ID', value: `#${txData.id}` },
          { label: 'Harvest Lot Reference', value: `#${txData.lotId}` },
          { label: 'Seller Farmer', value: txData.seller },
          { label: 'Buyer Institution', value: txData.buyer },
          { label: 'Commodity Variety', value: txData.commodity },
          { label: 'Contracted Quantity', value: txData.quantity },
          { label: 'Agreed Price Rate', value: txData.unitPrice },
          { label: 'Procurement Status', value: txData.procurementStatus },
          { label: 'Settlement Status', value: `${txData.settlementStatus} (Ref: ${txData.reference})` }
        ],
        highlightResult: {
          label: 'NET PROCEED SETTLEMENT AMOUNT',
          value: txData.netAmount,
          subtext: 'Demonstration Escrow Record • Gross: ₹5,80,800.00 | Deductions: ₹0.00'
        },
        footer: {
          operator: 'AgriSync Settlement Terminal',
          terminal: 'SIMULATED ESCROW SETTLEMENT NODE',
          location: 'National APMC Mandi Network',
          disclaimer: 'Simulated escrow ledger representation. No physical banking or NPCI switch connected.'
        }
      },
      `Invoice_${txData.id}.pdf`
    );

    setTimeout(() => {
      setDownloading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">Certified Electronic Sauda Slip</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
              SIMULATED ESCROW SETTLEMENT NODE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mt-1">Transaction #{txData.id}</h1>
        </div>

        <Link
          to="/transactions"
          className="self-start sm:self-auto px-3.5 py-2 bg-slate-100 text-[#0f172a] border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Ledger</span>
        </Link>
      </div>

      {/* Main Slip Card */}
      <div id="sauda-slip-card" className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-5 sm:space-y-6 print:shadow-none print:border-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#047857] text-white flex items-center justify-center font-bold shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base text-[#0f172a]">Commercial Mandi Settlement Voucher</div>
              <div className="text-xs text-[#047857] font-bold">Simulated Reference: {txData.reference}</div>
            </div>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black border border-emerald-200">
            {txData.settlementStatus}
          </span>
        </div>

        {/* Trade Participants */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs text-slate-700 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
          <div>
            <span className="text-slate-500 block font-semibold">Seller Farmer:</span>
            <strong className="text-[#0f172a] text-sm">{txData.seller}</strong>
            <p className="text-slate-500 mt-0.5">Produce Lot: <strong className="font-mono text-slate-800">#{txData.lotId}</strong></p>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">Buyer Institution:</span>
            <strong className="text-[#0f172a] text-sm">{txData.buyer}</strong>
            <p className="text-slate-500 mt-0.5">Procurement Status: <strong>{txData.procurementStatus}</strong></p>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-100 pb-2.5 gap-1">
            <span className="text-slate-600">Commodity & Quantity:</span>
            <strong className="font-semibold text-slate-900">{txData.commodity} • {txData.quantity}</strong>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-600">Contract Unit Price:</span>
            <strong className="font-data-tabular text-slate-900">{txData.unitPrice}</strong>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-600">Gross Contract Value:</span>
            <strong className="font-data-tabular text-slate-900">{txData.grossAmount}</strong>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-2.5 text-slate-500">
            <span>Deductions & APMC Fee:</span>
            <strong className="font-data-tabular">{txData.deductions}</strong>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-600">Payment Status:</span>
            <strong className="text-emerald-700">{txData.paymentStatus}</strong>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline pt-2 text-sm sm:text-base font-black text-[#0f172a] gap-1">
            <span>Net Settlement Payable to Farmer:</span>
            <span className="text-[#047857] font-data-tabular text-base sm:text-lg">{txData.netAmount}</span>
          </div>
        </div>

        {/* Simulated Settlement Disclaimer */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-0.5">
          <div className="font-bold flex items-center gap-1">
            <ShieldCheck size={14} /> SIMULATED ESCROW SETTLEMENT NODE
          </div>
          <p className="text-[11px] text-amber-700 font-normal">
            This transaction voucher represents a simulated state-machine escrow settlement. No physical ICICI API banking switch, live NPCI DBT, or monetary disbursement was executed.
          </p>
        </div>

        {/* Download Action */}
        <div className="pt-2 text-center print:hidden">
          <button
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto px-6 py-3 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-black shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Download size={15} />
            <span>{downloading ? 'Preparing Official PDF...' : 'Download Official Trade Slip (PDF)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
