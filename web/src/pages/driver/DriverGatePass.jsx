import React, { useState } from 'react';
import { QrCode, Download, ShieldCheck, CheckCircle2, Clock, MapPin, Truck } from 'lucide-react';
import { generateSlipPDF } from '../../utils/pdfGenerator';

const GATE_PASS_RECORDS = [
  {
    passId: 'PASS-MH15-88412',
    token: 'Token #B-14',
    driver: 'Dattatray Shinde',
    vehicle: 'MH-15-EG-4412 (Mahindra Bolero)',
    plate: 'MH-15-EG-4412',
    lot: 'LOT-2024-098',
    crop: 'Red Onion Garwa (24.0 MT)',
    gate: 'Gate #2 Entry (Weighbridge Scale #1)',
    arrivalWindow: 'Today 08:30 AM – 11:30 AM',
    validity: 'Valid until 11:59 PM Today',
    status: 'ACTIVE — AUTHORIZED FAST-TRACK'
  },
  {
    passId: 'PASS-MH15-88415',
    token: 'Token #B-15',
    driver: 'Sanjay More',
    vehicle: 'MH-15-BJ-9182 (Tata 1109)',
    plate: 'MH-15-BJ-9182',
    lot: 'LOT-2024-102',
    crop: 'Soybean (12.5 MT)',
    gate: 'Gate #1 Entry (Unloading Bay #3)',
    arrivalWindow: 'Today 11:00 AM – 02:00 PM',
    validity: 'Valid until 11:59 PM Today',
    status: 'ACTIVE — AUTHORIZED FAST-TRACK'
  },
  {
    passId: 'PASS-MH15-88419',
    token: 'Token #B-16',
    driver: 'Kishan Logistics',
    vehicle: 'MH-15-CL-3390 (Ashok Leyland)',
    plate: 'MH-15-CL-3390',
    lot: 'LOT-2024-105',
    crop: 'Tomato (8.0 MT)',
    gate: 'Gate #2 Entry (Perishables Bay)',
    arrivalWindow: 'Today 01:30 PM – 04:30 PM',
    validity: 'Valid until 11:59 PM Today',
    status: 'ACTIVE — AUTHORIZED FAST-TRACK'
  }
];

export const DriverGatePass = () => {
  const [selectedPassIndex, setSelectedPassIndex] = useState(0);
  const activePass = GATE_PASS_RECORDS[selectedPassIndex];

  const handleDownloadPDF = () => {
    generateSlipPDF(
      {
        organization: 'APMC DRAYAGE FAST-TRACK KIOSK',
        title: 'FAST-TRACK DRAYAGE GATE PASS',
        subtitle: 'ANPR Automatic Barrier Security Access Token',
        referenceNo: activePass.passId,
        dateTime: new Date().toLocaleString('en-IN'),
        fields: [
          { label: 'Gate Pass Reference', value: activePass.passId },
          { label: 'Assigned Token Number', value: activePass.token },
          { label: 'APMC Mandi Yard', value: 'Pimpalgaon Baswant APMC Yard #2' },
          { label: 'Driver Name', value: activePass.driver },
          { label: 'Vehicle Registration Plate', value: activePass.plate },
          { label: 'Produce Cargo Batch', value: `${activePass.lot} • ${activePass.crop}` },
          { label: 'Assigned Mandi Gate', value: activePass.gate },
          { label: 'Validity Window', value: activePass.validity }
        ],
        highlightResult: {
          label: 'BARRIER ACCESS AUTHORIZATION',
          value: 'DIGITAL GATE PASS — DEMO',
          subtext: 'Demonstration fast-track gate pass. Present at simulated ANPR kiosk.'
        },
        footer: {
          operator: 'ANPR Security Gate Terminal',
          terminal: 'Gate Barrier Kiosk #2',
          location: 'Pimpalgaon APMC Yard',
          disclaimer: 'Simulated gate pass for demonstration. No physical government barrier link.'
        }
      },
      `Gate_Pass_${activePass.passId}.pdf`
    );
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    JSON.stringify({
      passId: activePass.passId,
      token: activePass.token,
      plate: activePass.plate,
      lot: activePass.lot,
      status: 'DEMO_AUTHORIZED'
    })
  )}`;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2">
          <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">Fast-Track Gate Pass Kiosk</span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
            DIGITAL GATE PASS — DEMO
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0f172a]">APMC Drayage Fast-Track Pass</h1>
        <p className="text-xs text-slate-500 font-medium">
          Digital gate pass for ANPR barcode entry. Synchronized with active mandi queue token.
        </p>
      </div>

      {/* Active Token Switcher */}
      <div className="flex justify-center gap-2">
        {GATE_PASS_RECORDS.map((p, idx) => (
          <button
            key={p.passId}
            onClick={() => setSelectedPassIndex(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedPassIndex === idx
                ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {p.token} ({p.plate})
          </button>
        ))}
      </div>

      {/* Main Card */}
      <div id="driver-gate-pass-card" className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#047857] shadow-xl text-center space-y-5">
        {/* QR Code Frame */}
        <div className="inline-block p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-inner">
          <img
            src={qrUrl}
            alt="Scannable Gate Pass QR Code"
            className="w-48 h-48 mx-auto rounded-xl shadow-xs border border-slate-200"
          />
          <span className="font-mono font-black text-sm text-[#0f172a] mt-3 block">
            {activePass.passId}
          </span>
        </div>

        {/* Pass Details */}
        <div className="space-y-2 text-xs text-[#0f172a]">
          <div className="text-lg font-black text-[#047857]">
            {activePass.token} • Pimpalgaon APMC Yard #2
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Driver Name:</span>
              <strong className="text-slate-900">{activePass.driver}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Vehicle Registration:</span>
              <strong className="font-mono text-slate-900">{activePass.vehicle}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Produce Cargo:</span>
              <strong className="text-slate-900">{activePass.crop}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Assigned Gate:</span>
              <strong className="text-[#047857]">{activePass.gate}</strong>
            </div>
            <div className="sm:col-span-2 pt-1 border-t border-slate-200 flex justify-between">
              <div>
                <span className="text-slate-500 block">Validity:</span>
                <strong className="text-slate-800">{activePass.validity}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Arrival Slot:</span>
                <strong className="text-slate-800">{activePass.arrivalWindow}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Notice Banner */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800 space-y-0.5">
          <div>Present this QR code or registered plate at ANPR Barrier #1 / #2.</div>
          <div className="text-[10px] text-emerald-600 font-normal">
            Notice: DIGITAL GATE PASS — DEMO. Simulated for demonstration presentation.
          </div>
        </div>

        {/* Download Action */}
        <div className="pt-2">
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-extrabold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Download size={15} /> Download Gate Pass PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverGatePass;
