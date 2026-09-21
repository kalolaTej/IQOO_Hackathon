import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, CheckCircle2, AlertTriangle, MapPin, Clock, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

const INITIAL_DRIVERS = [
  {
    id: 'DRV-01',
    name: 'Dattatray Shinde',
    phone: '+91-98221 44120',
    vehicle: 'Mahindra Bolero Pickup',
    plate: 'MH-15-EG-4412',
    capacityMT: 3.5,
    capacityDisplay: '3.5 MT',
    fare: '₹1,200 / Trip',
    rating: '★ 4.9 (42 trips)',
    origin: 'Farmgate (Niphad Sector 4)',
    destination: 'Pimpalgaon APMC Yard #2',
    eta: '15 mins away',
    status: 'Booked — Assigned',
    linkedLot: '#LOT-2024-098 (Red Onion)',
    linkedToken: 'Token #B-14'
  },
  {
    id: 'DRV-02',
    name: 'Sanjay More Transport',
    phone: '+91-98220 91823',
    vehicle: 'Tata 1109 Eicher Truck',
    plate: 'MH-15-BJ-9182',
    capacityMT: 10.0,
    capacityDisplay: '10.0 MT',
    fare: '₹2,800 / Trip',
    rating: '★ 4.8 (88 trips)',
    origin: 'Farmgate (Pimpalgaon Cluster)',
    destination: 'Pimpalgaon APMC Gate #1',
    eta: '30 mins away',
    status: 'Available',
    linkedLot: '#LOT-2024-102 (Soybean)',
    linkedToken: 'Token #B-15'
  },
  {
    id: 'DRV-03',
    name: 'Kishan Logistics Fleet',
    phone: '+91-94225 33901',
    vehicle: 'Ashok Leyland 6-Wheeler',
    plate: 'MH-15-CL-3390',
    capacityMT: 25.0,
    capacityDisplay: '25.0 MT',
    fare: '₹5,500 / Trip',
    rating: '★ 5.0 (150+ trips)',
    origin: 'Farmgate (Dindori Road)',
    destination: 'Nashik APMC Main Gate',
    eta: '1 hour away',
    status: 'Available',
    linkedLot: '#LOT-2024-105 (Tomato)',
    linkedToken: 'Token #B-16'
  }
];

export const TransportOptions = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [bookingPayload, setBookingPayload] = useState({
    lot: 'LOT-2024-098 (Red Onion - 24.0 MT)',
    requestedQuantityMT: '3.0',
    origin: 'Rajesh Farmgate (Niphad)',
    destination: 'Pimpalgaon APMC Yard #2'
  });

  const [validationError, setValidationError] = useState(null);

  const handleOpenBookingModal = (d) => {
    setSelectedDriver(d);
    setBookingPayload((prev) => ({
      ...prev,
      requestedQuantityMT: String(Math.min(d.capacityMT, 3.0))
    }));
    setValidationError(null);
    setShowModal(true);
  };

  const handleQuantityChange = (val, maxCap) => {
    setBookingPayload({ ...bookingPayload, requestedQuantityMT: val });
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setValidationError('Please enter a valid positive transport quantity.');
    } else if (num > maxCap) {
      setValidationError(
        `Capacity Exceeded: Requested cargo (${num.toFixed(1)} MT) exceeds vehicle maximum payload (${maxCap} MT). Please select a larger transport vehicle.`
      );
    } else {
      setValidationError(null);
    }
  };

  const handleConfirmTransportBooking = (e) => {
    e.preventDefault();
    const qty = parseFloat(bookingPayload.requestedQuantityMT);

    if (isNaN(qty) || qty <= 0) {
      setValidationError('Please enter a valid transport weight.');
      return;
    }

    if (qty > selectedDriver.capacityMT) {
      setValidationError(
        `Capacity Exceeded: Requested cargo (${qty} MT) exceeds vehicle maximum payload (${selectedDriver.capacityMT} MT).`
      );
      return;
    }

    // Update driver status
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === selectedDriver.id
          ? {
              ...d,
              status: 'Booked — Gate Pass Ready',
              linkedLot: bookingPayload.lot
            }
          : d
      )
    );

    setShowModal(false);
    setToastMessage(
      `✓ Transport Booked! ${selectedDriver.name} (${selectedDriver.vehicle}) assigned. Proceeding to Fast-Track Gate Pass.`
    );

    setTimeout(() => {
      navigate('/driver/gate-pass');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-2xl text-xs font-black shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">Fulfillment & Drayage</span>
          <h1 className="text-2xl font-black text-[#0f172a]">Rural Transport & Drayage Options</h1>
          <p className="text-xs text-slate-600 mt-1">
            Book verified farm-to-mandi pickup vehicles with ANPR gate pass sync.
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
          Active Fleet: {drivers.length} Vehicles
        </div>
      </div>

      {/* Vehicle List */}
      <div className="space-y-4">
        {drivers.map((d) => {
          const isBooked = d.status.startsWith('Booked');

          return (
            <div
              key={d.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-base text-[#0f172a]">{d.name}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                    {d.rating}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isBooked
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                <div className="text-xs text-slate-700 font-medium">
                  <strong>{d.vehicle}</strong> • <span className="font-mono">{d.plate}</span> • Payload Capacity:{' '}
                  <strong className="text-[#047857]">{d.capacityDisplay}</strong>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span>Route: {d.origin} → {d.destination}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span>
                      Est. Arrival: <strong>{d.eta}</strong>{' '}
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        SIMULATED ETA
                      </span>
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex flex-wrap gap-4">
                  <span>Linked Lot: <strong>{d.linkedLot}</strong></span>
                  <span>Mandi Token: <strong className="text-[#047857]">{d.linkedToken}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-left md:text-right">
                  <div className="text-xl font-black text-[#0f172a] font-data-tabular">{d.fare}</div>
                  <div className="text-[10px] text-[#047857] font-bold">Fast-Track Gate Pass Included</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenBookingModal(d)}
                    className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer active:scale-98"
                  >
                    Book Transport
                  </button>

                  <Link
                    to="/driver/gate-pass"
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#0f172a] rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <span>Pass</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Validation Modal */}
      {showModal && selectedDriver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#047857] uppercase">Confirm Drayage Booking</span>
                <h2 className="text-base font-black text-[#0f172a]">{selectedDriver.vehicle}</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 text-xl font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmTransportBooking} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-slate-700">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Assigned Driver:</span>
                  <strong>{selectedDriver.name}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Vehicle Registration:</span>
                  <strong className="font-mono">{selectedDriver.plate}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Vehicle Max Capacity:</span>
                  <strong className="text-[#047857]">{selectedDriver.capacityDisplay}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Produce Harvest Lot *</label>
                <select
                  value={bookingPayload.lot}
                  onChange={(e) => setBookingPayload({ ...bookingPayload, lot: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                >
                  <option value="LOT-2024-098 (Red Onion - 24.0 MT)">LOT-2024-098 (Red Onion - 24.0 MT)</option>
                  <option value="LOT-2024-102 (Soybean - 12.5 MT)">LOT-2024-102 (Soybean - 12.5 MT)</option>
                  <option value="LOT-2024-105 (Tomato - 8.0 MT)">LOT-2024-105 (Tomato - 8.0 MT)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-bold text-slate-700">Cargo Load Weight (MT) *</label>
                  <span className="text-[10px] text-slate-500">Max: {selectedDriver.capacityDisplay}</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={bookingPayload.requestedQuantityMT}
                  onChange={(e) => handleQuantityChange(e.target.value, selectedDriver.capacityMT)}
                  className={`w-full px-3.5 py-2.5 rounded-xl font-data-tabular font-bold outline-none border ${
                    validationError ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-[#f8fafc] text-[#0f172a]'
                  }`}
                />
                {validationError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] font-bold mt-1.5 flex items-start gap-1.5">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-slate-400">Pickup Location:</span>
                  <strong>{bookingPayload.origin}</strong>
                </div>
                <div>
                  <span className="block text-slate-400">Drop Mandi Yard:</span>
                  <strong>{bookingPayload.destination}</strong>
                </div>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(validationError)}
                  className={`w-full sm:w-auto px-5 py-2.5 font-black rounded-xl shadow-md transition-all text-center ${
                    validationError
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#047857] hover:bg-[#065f46] text-white cursor-pointer active:scale-98'
                  }`}
                >
                  Confirm Drayage Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportOptions;
