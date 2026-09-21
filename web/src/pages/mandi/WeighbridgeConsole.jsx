import React, { useState } from 'react';
import { Scale, CheckCircle2, AlertTriangle, Printer, RefreshCw, FileText } from 'lucide-react';
import { generateSlipPDF } from '../../utils/pdfGenerator';

export const WeighbridgeConsole = () => {
  const [grossInput, setGrossInput] = useState('18420');
  const [tareInput, setTareInput] = useState('6020');
  const [confirmedReceipt, setConfirmedReceipt] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [receiptCounter, setReceiptCounter] = useState(1);

  // Numeric parsing and validation
  const grossNum = parseFloat(grossInput);
  const tareNum = parseFloat(tareInput);

  const isNumeric = !isNaN(grossNum) && !isNaN(tareNum) && grossNum >= 0 && tareNum >= 0;
  const isValid = isNumeric && grossNum >= tareNum;
  const netNum = isValid ? grossNum - tareNum : 0;

  const grossDisplay = !isNaN(grossNum) ? `${grossNum.toLocaleString('en-IN')} kg` : '—';
  const tareDisplay = !isNaN(tareNum) ? `${tareNum.toLocaleString('en-IN')} kg` : '—';
  const netDisplay = isValid ? `${netNum.toLocaleString('en-IN')} kg` : '—';
  const netMetricTons = isValid ? `${(netNum / 1000).toFixed(2)} MT` : '—';

  const handleConfirmWeighing = () => {
    if (!isValid) return;

    // Generate deterministic reference receipt: WB-2026-0001
    const receiptNo = `WB-2026-${String(receiptCounter).padStart(4, '0')}`;
    setConfirmedReceipt({
      receiptNo,
      token: 'Token #B-14',
      vehicle: 'MH-15-EG-4412',
      driver: 'Dattatray Shinde',
      farmer: 'Rajesh Tukaram Patil',
      crop: 'Red Onion (Garwa)',
      gross: grossDisplay,
      tare: tareDisplay,
      net: `${netDisplay} (${netMetricTons})`,
      timestamp: new Date().toLocaleString('en-IN')
    });
    setReceiptCounter((prev) => prev + 1);
    setShowSlipModal(true);
  };

  const handlePrintSlip = () => {
    if (!confirmedReceipt) return;

    generateSlipPDF(
      {
        organization: 'PIMPALGAON BASWANT APMC YARD #2',
        title: 'APMC MANDI CERTIFIED WEIGHBRIDGE SLIP',
        subtitle: 'Digital Scale Console Terminal #1',
        referenceNo: confirmedReceipt.receiptNo,
        dateTime: confirmedReceipt.timestamp,
        fields: [
          { label: 'Receipt Reference', value: confirmedReceipt.receiptNo },
          { label: 'Token / Queue Ref', value: confirmedReceipt.token },
          { label: 'Vehicle Registration', value: confirmedReceipt.vehicle },
          { label: 'Driver Name', value: confirmedReceipt.driver },
          { label: 'Farmer / Seller', value: confirmedReceipt.farmer },
          { label: 'Produce Commodity', value: confirmedReceipt.crop }
        ],
        grossWeight: grossInput,
        tareWeight: tareInput,
        highlightResult: {
          label: 'CERTIFIED NET HARVEST PRODUCE WEIGHT',
          value: netDisplay,
          subtext: netMetricTons
        },
        footer: {
          operator: 'Sanjay Deshmukh (Secretary)',
          terminal: 'Scale Console Terminal #1',
          location: 'Pimpalgaon APMC Yard',
          disclaimer: 'APMC Digital Weighbridge Simulation Record'
        }
      },
      `Weighbridge_Slip_${confirmedReceipt.receiptNo}.pdf`
    );
  };

  const handleResetToStandard = () => {
    setGrossInput('18420');
    setTareInput('6020');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">APMC Scale Operator Console</span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
            DIGITAL WEIGHBRIDGE SIMULATION
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0f172a]">Digital Weighbridge Operator Terminal</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Dual-axle gross and tare vehicle scale calibration terminal. No physical weighbridge hardware connected.
        </p>
      </div>

      {/* Validation Alert */}
      {!isValid && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-black">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>
              Scale Validation Error: Gross weight ({grossDisplay}) cannot be less than vehicle tare weight ({tareDisplay}). Net produce weight cannot be negative.
            </span>
          </div>
          <button
            onClick={handleResetToStandard}
            className="text-[11px] underline font-bold hover:text-red-900 shrink-0 ml-3 cursor-pointer"
          >
            Reset Scale
          </button>
        </div>
      )}

      {/* Main Console Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-[#047857]" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Scale Calibration & Weight Entries
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Station ID: WB-SCALE-01</span>
        </div>

        {/* Weight Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#f8fafc] border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-extrabold text-[#0f172a]">
              Loaded Vehicle Gross Weight (kg)
            </label>
            <input
              type="number"
              value={grossInput}
              onChange={(e) => setGrossInput(e.target.value)}
              placeholder="e.g. 18420"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-data-tabular font-black text-lg text-[#0f172a] outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
            />
            <p className="text-[11px] text-slate-500">Truck + Trailer + Onion Harvest Cargo</p>
          </div>

          <div className="p-4 bg-[#f8fafc] border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-extrabold text-[#0f172a]">
              Empty Vehicle Tare Weight (kg)
            </label>
            <input
              type="number"
              value={tareInput}
              onChange={(e) => setTareInput(e.target.value)}
              placeholder="e.g. 6020"
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-data-tabular font-black text-lg text-[#0f172a] outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
            />
            <p className="text-[11px] text-slate-500">Unladen vehicle empty weight rating</p>
          </div>
        </div>

        {/* Calculated Results Display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Gross Weight</span>
            <div className="text-2xl font-black text-[#0f172a] font-data-tabular mt-1">{grossDisplay}</div>
            <div className="text-[10px] text-slate-400 mt-1">Scale Sensor #1</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Tare Weight</span>
            <div className="text-2xl font-black text-[#0f172a] font-data-tabular mt-1">{tareDisplay}</div>
            <div className="text-[10px] text-slate-400 mt-1">Scale Sensor #2</div>
          </div>

          <div
            className={`p-4 rounded-xl text-center border transition-all ${
              isValid ? 'bg-[#dcfce7] border-[#bbf7d0]' : 'bg-red-50 border-red-200'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase ${isValid ? 'text-[#15803d]' : 'text-red-600'}`}>
              Net Harvest Produce Weight
            </span>
            <div
              className={`text-2xl font-black font-data-tabular mt-1 ${
                isValid ? 'text-[#047857]' : 'text-red-700'
              }`}
            >
              {netDisplay}
            </div>
            <div className={`text-[10px] font-bold mt-1 ${isValid ? 'text-[#15803d]' : 'text-red-500'}`}>
              {isValid ? `${netMetricTons} (Certified Harvest Net)` : 'Invalid Scale Values'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 font-medium">
            Active Lot Under Scale: <strong className="text-slate-800">Token #B-14 (MH-15-EG-4412)</strong>
          </div>

          <button
            onClick={handleConfirmWeighing}
            disabled={!isValid}
            className={`px-6 py-3 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98 ${
              isValid
                ? 'bg-[#047857] hover:bg-[#065f46] text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={16} /> Confirm Weighing & Generate Receipt
          </button>
        </div>
      </div>

      {/* Certified Weighbridge Slip Modal */}
      {showSlipModal && confirmedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-[#047857]" size={22} />
                <h2 className="text-base font-black text-[#0f172a]">
                  Certified Slip #{confirmedReceipt.receiptNo}
                </h2>
              </div>
              <button
                onClick={() => setShowSlipModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-800">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Official Receipt No:</span>
                <strong className="text-[#047857] font-mono text-sm font-black">
                  {confirmedReceipt.receiptNo}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Queue Token:</span>
                <strong className="text-[#047857] font-black">{confirmedReceipt.token}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Registration:</span>
                <strong className="font-mono font-bold">{confirmedReceipt.vehicle}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Driver Name:</span>
                <strong>{confirmedReceipt.driver}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Farmer / Supplier:</span>
                <strong>{confirmedReceipt.farmer}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Produce Commodity:</span>
                <strong>{confirmedReceipt.crop}</strong>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Scale Weight:</span>
                  <strong className="font-data-tabular">{confirmedReceipt.gross}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Tare Weight:</span>
                  <strong className="font-data-tabular">{confirmedReceipt.tare}</strong>
                </div>
                <div className="flex justify-between text-sm font-black text-[#047857] pt-1 border-t border-slate-200">
                  <span>Certified Net Weight:</span>
                  <strong className="font-data-tabular">{confirmedReceipt.net}</strong>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 flex justify-between">
                <span>Pimpalgaon APMC Yard Terminal #1</span>
                <span>{confirmedReceipt.timestamp}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSlipModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handlePrintSlip}
                className="px-5 py-2 bg-[#047857] hover:bg-[#065f46] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Printer size={15} /> Print Official Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeighbridgeConsole;
