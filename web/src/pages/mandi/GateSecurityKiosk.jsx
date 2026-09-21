import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Camera, RefreshCw, AlertTriangle } from 'lucide-react';

const QUEUE_RECORDS = [
  { token: 'Token #B-15', expectedPlate: 'MH-15-BJ-9182', farmer: 'Suresh More', driver: 'Sanjay More', crop: 'Soybean (12.5 MT)', gate: 'Gate #1 Entry' },
  { token: 'Token #B-14', expectedPlate: 'MH-15-EG-4412', farmer: 'Rajesh Patil', driver: 'Dattatray Shinde', crop: 'Red Onion (24.0 MT)', gate: 'Gate #2 Entry' },
  { token: 'Token #B-16', expectedPlate: 'MH-15-CL-3390', farmer: 'Dinesh Pawar', driver: 'Kishan Logistics', crop: 'Tomato (8.0 MT)', gate: 'Gate #2 Entry' },
];

export const GateSecurityKiosk = () => {
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  const activeRecord = QUEUE_RECORDS[selectedRecordIndex];

  // Manual vehicle plate input (scanned vs expected)
  const [scannedPlateInput, setScannedPlateInput] = useState(activeRecord.expectedPlate);
  const [hasScanned, setHasScanned] = useState(true);
  const [barrierOpen, setBarrierOpen] = useState(false);

  // Deterministic plate comparison: strict alphanumeric normalization
  const normalize = (str) => (str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const expectedNormalized = normalize(activeRecord.expectedPlate);
  const scannedNormalized = normalize(scannedPlateInput);
  const isMatch = scannedNormalized.length > 0 && expectedNormalized === scannedNormalized;

  const handleScanVerification = () => {
    setHasScanned(true);
    if (isMatch) {
      setBarrierOpen(true);
    } else {
      setBarrierOpen(false);
    }
  };

  const handleSelectRecord = (idx) => {
    setSelectedRecordIndex(idx);
    setScannedPlateInput(QUEUE_RECORDS[idx].expectedPlate);
    setBarrierOpen(false);
    setHasScanned(false);
  };

  const handleLoadMismatchPlate = () => {
    setScannedPlateInput('MH-12-AB-4091');
    setBarrierOpen(false);
    setHasScanned(false);
  };

  const handleLoadMatchingPlate = () => {
    setScannedPlateInput(activeRecord.expectedPlate);
    setBarrierOpen(false);
    setHasScanned(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">APMC Gate Terminal Kiosk</span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
            DIGITAL ANPR CAMERA SIMULATION
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mt-1">ANPR Gate Security Console</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Automated number-plate recognition & gate barrier access validation terminal.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Left Column: Camera Simulation Feed & Manual Scanner Controls */}
        <div className="space-y-4">
          {/* Simulated ANPR Viewport */}
          <div className="h-52 sm:h-56 bg-[#0f172a] rounded-xl flex flex-col items-center justify-center text-white relative overflow-hidden border border-slate-800">
            {/* Viewport scan lines */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-emerald-500/10 to-transparent animate-pulse pointer-events-none" />

            {/* Simulation Header Badge */}
            <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-[9px] sm:text-[10px] px-2 py-0.5 rounded font-black tracking-wider shadow-xs">
              DIGITAL ANPR SIMULATION
            </div>

            <div className="absolute top-3 right-3 bg-slate-900/80 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono border border-emerald-500/30">
              FPS: 30 • 1080P
            </div>

            <div className="text-center space-y-2 z-10 p-2">
              <Camera size={38} className="mx-auto text-emerald-400 opacity-80" />
              <div className="text-[10px] sm:text-[11px] font-mono text-slate-300 tracking-wider">
                ANPR OPTICAL SENSOR OVERLAY
              </div>
              <div className="inline-block px-3 py-1 bg-black/60 border border-emerald-400/50 rounded-lg text-xs font-mono font-black text-emerald-300">
                [OCR: {scannedPlateInput || 'EMPTY'}]
              </div>
            </div>

            {/* Bottom Gate Indicator */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] sm:text-[10px] font-mono px-2 py-1 bg-black/70 rounded">
              <span className="text-slate-400 truncate">GATE: {activeRecord.gate}</span>
              <span className={barrierOpen ? 'text-emerald-400 font-bold shrink-0' : 'text-slate-400 font-bold shrink-0'}>
                {barrierOpen ? 'BARRIER: LIFTED' : 'BARRIER: LOWERED'}
              </span>
            </div>
          </div>

          {/* Active Queue Token Selector */}
          <div>
            <label className="block text-xs font-bold text-[#0f172a] mb-1">
              Active Queue Token Under Inspection
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {QUEUE_RECORDS.map((rec, idx) => (
                <button
                  key={rec.token}
                  onClick={() => handleSelectRecord(idx)}
                  className={`p-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                    selectedRecordIndex === idx
                      ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-data-tabular text-[11px] sm:text-xs">{rec.token}</div>
                  <div className="text-[9px] sm:text-[10px] opacity-80 truncate">{rec.expectedPlate}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Scanned Vehicle Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#0f172a]">
                Manual Scanned Vehicle Plate Input
              </label>
              <div className="flex gap-1.5">
                <button
                  onClick={handleLoadMatchingPlate}
                  className="text-[10px] font-bold text-[#047857] hover:underline"
                >
                  Match
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleLoadMismatchPlate}
                  className="text-[10px] font-bold text-red-600 hover:underline"
                >
                  Mismatch
                </button>
              </div>
            </div>
            <input
              type="text"
              value={scannedPlateInput}
              onChange={(e) => {
                setScannedPlateInput(e.target.value.toUpperCase());
                setHasScanned(false);
              }}
              placeholder="e.g. MH-15-BJ-9182"
              className="w-full px-4 py-2.5 bg-[#f8fafc] border-2 border-[#047857] rounded-xl text-base font-black text-[#0f172a] uppercase text-center font-data-tabular outline-none focus:ring-2 focus:ring-[#047857]/20"
            />
          </div>

          {/* Scan Action Button */}
          <button
            onClick={handleScanVerification}
            className="w-full py-3 bg-[#047857] hover:bg-[#065f46] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RefreshCw size={15} /> Validate Plate & Trigger Gate Logic
          </button>
        </div>

        {/* Right Column: Verification Slip & Deterministic Status */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-extrabold text-sm text-[#0f172a]">Security Verification Slip</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                Gate #1 Terminal
              </span>
            </div>

            <div className="text-xs text-slate-700 space-y-2 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Queue Token:</span>
                <strong className="text-[#047857] font-black font-data-tabular">{activeRecord.token}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Farmer / Supplier:</span>
                <strong>{activeRecord.farmer}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Driver:</span>
                <strong>{activeRecord.driver}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Produce Lot:</span>
                <strong>{activeRecord.crop}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gate Assignment:</span>
                <strong>{activeRecord.gate}</strong>
              </div>

              <div className="border-t border-slate-200 pt-2.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected Vehicle Plate:</span>
                  <strong className="font-mono font-bold text-slate-900">{activeRecord.expectedPlate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scanned Vehicle Plate:</span>
                  <strong className="font-mono font-bold text-slate-900">{scannedPlateInput || 'None'}</strong>
                </div>
              </div>

              {/* Match Status Card */}
              <div className="border-t border-slate-200 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Plate Match Status:</span>
                  {isMatch ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-xs">
                      <CheckCircle2 size={14} /> MATCH
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 font-black text-xs">
                      <XCircle size={14} /> MISMATCH
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Barrier Status Banner */}
          <div
            className={`p-5 rounded-2xl text-center border font-black text-sm transition-all shadow-xs ${
              barrierOpen
                ? 'bg-[#047857] text-white border-[#047857]'
                : hasScanned && !isMatch
                ? 'bg-red-700 text-white border-red-700'
                : 'bg-[#0f172a] text-white border-[#0f172a]'
            }`}
          >
            {barrierOpen ? (
              <div className="space-y-1">
                <div className="text-base font-black">OPEN — AUTOMATIC BARRIER LIFTED</div>
                <div className="text-xs font-normal opacity-90">Vehicle {activeRecord.expectedPlate} cleared for Mandi yard entry.</div>
              </div>
            ) : hasScanned && !isMatch ? (
              <div className="space-y-1">
                <div className="text-base font-black">ACCESS DENIED — VEHICLE MISMATCH</div>
                <div className="text-xs font-normal opacity-90">Scanned plate does not match booking token. Entry prohibited.</div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-base font-black">BARRIER CLOSED — AWAITING SCAN</div>
                <div className="text-xs font-normal opacity-70">Awaiting automated OCR optical plate verification.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GateSecurityKiosk;
