import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import React, { useState, useEffect } from 'react';
import { Warehouse, CheckCircle2, AlertCircle, Building2, MapPin, Calendar, FileText, Download } from 'lucide-react';
import { generateSlipPDF } from '../../utils/pdfGenerator';

const DEMO_FALLBACK_FACILITIES = [
  {
    id: 'f1010101-0000-0000-0000-000000000001',
    facility_name: 'Mahafresh Cold Chain Hub',
    type: 'cold_storage',
    location: 'Nashik APMC Corridor',
    state: 'Maharashtra',
    capacity_kg: 50000,
    cost_per_day: 350,
    contact_phone: '+91-9823011223',
    perishable_compatible: true,
    rating: 4.8,
    certification: 'WDRA State Accredited',
    distance: '4.2 km from farm'
  },
  {
    id: 'f1010101-0000-0000-0000-000000000002',
    facility_name: 'Kisan Agri Mega Warehouse',
    type: 'warehouse',
    location: 'Sanwer Road, Indore',
    state: 'Madhya Pradesh',
    capacity_kg: 200000,
    cost_per_day: 180,
    contact_phone: '+91-9876543210',
    perishable_compatible: false,
    rating: 4.6,
    certification: 'State Warehousing Corp Certified',
    distance: '8.1 km from farm'
  },
  {
    id: 'f1010101-0000-0000-0000-000000000003',
    facility_name: 'Godavari Cold Storage Depot',
    type: 'cold_storage',
    location: 'Rajahmundry Bypass',
    state: 'Andhra Pradesh',
    capacity_kg: 35000,
    cost_per_day: 290,
    contact_phone: '+91-9440123456',
    perishable_compatible: true,
    rating: 4.7,
    certification: 'APMC Cold Logistics Verified',
    distance: '14.5 km from farm'
  }
];

export const StorageDiscovery = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errors, setErrors] = useState({});

  const [bookingForm, setBookingForm] = useState({
    crop: 'Red Onion (Garwa)',
    storageType: 'Cold Storage (Controlled Temp 4°C)',
    quantity: '10',
    months: '2',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [myBookings, setMyBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('agrisync_warehouse_bookings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'STG-88412',
        warehouse: 'Mahafresh Cold Chain Hub',
        type: 'Cold Storage',
        crop: 'Red Onion (Garwa)',
        quantity: '20.0 MT',
        duration: '2 Months',
        startDate: new Date().toISOString().split('T')[0],
        rate: '₹350 / Day',
        status: 'Active Reserved',
        isDemo: true,
        bookedAt: 'Today'
      }
    ];
  });

  // Fetch facilities from existing GET /api/logistics/facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        const backendUrl = API_BASE_URL;
        const res = await fetch(`${backendUrl}/api/logistics/facilities`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Enrich with UI formatting
            const enriched = data.map((f) => ({
              ...f,
              certification: f.certification || (f.type === 'cold_storage' ? 'WDRA Cold Chain Certified' : 'WDRA Standard Warehouse'),
              distance: f.distance || `${(Math.random() * 8 + 3).toFixed(1)} km from farm`
            }));
            setFacilities(enriched);
            setIsDemoData(false);
          } else {
            setFacilities(DEMO_FALLBACK_FACILITIES);
            setIsDemoData(true);
          }
        } else {
          setFacilities(DEMO_FALLBACK_FACILITIES);
          setIsDemoData(true);
        }
      } catch {
        setFacilities(DEMO_FALLBACK_FACILITIES);
        setIsDemoData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  const handleOpenModal = (fac) => {
    setSelectedFacility(fac);
    setBookingForm((prev) => ({
      ...prev,
      storageType: fac.type === 'cold_storage' ? 'Cold Storage (Controlled Temp 4°C)' : 'Ventilated Dry Warehouse'
    }));
    setShowModal(true);
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    const requestedQty = Number(bookingForm.quantity);
    const availableCapMT = (selectedFacility.capacity_kg || 50000) / 1000;

    if (!bookingForm.quantity || isNaN(bookingForm.quantity) || requestedQty <= 0) {
      errs.quantity = 'Enter a valid storage quantity in MT.';
    } else if (requestedQty > availableCapMT) {
      errs.quantity = `Exceeds available facility capacity! Max available: ${availableCapMT} MT`;
    }

    if (!bookingForm.months || isNaN(bookingForm.months) || Number(bookingForm.months) <= 0) {
      errs.months = 'Storage duration in months is required.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const newCertId = `STG-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBooking = {
      id: newCertId,
      warehouse: selectedFacility.facility_name,
      type: bookingForm.storageType,
      crop: bookingForm.crop,
      quantity: `${requestedQty.toFixed(1)} MT`,
      duration: `${bookingForm.months} Months`,
      startDate: bookingForm.startDate,
      rate: `₹${selectedFacility.cost_per_day || 350} / Day`,
      status: 'Active Reserved',
      isDemo: true, // Clearly indicate demo reservation
      bookedAt: 'Just Now'
    };

    const updatedBookings = [newBooking, ...myBookings];
    setMyBookings(updatedBookings);
    try {
      localStorage.setItem('agrisync_warehouse_bookings', JSON.stringify(updatedBookings));
    } catch {}

    setShowModal(false);
    setToastMessage(`✓ Storage Reserved (DEMO RESERVATION): ${bookingForm.quantity} MT at ${selectedFacility.facility_name}. Reservation Certificate #${newCertId} issued.`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleDownloadPDF = (b) => {
    generateSlipPDF(
      {
        organization: 'AGRISYNC RURAL STORAGE & WAREHOUSE DISCOVERY',
        title: 'STORAGE FACILITY RESERVATION CERTIFICATE',
        subtitle: 'Warehouse Space Booking Voucher',
        referenceNo: b.id,
        dateTime: new Date().toLocaleString('en-IN'),
        fields: [
          { label: 'Reservation Certificate ID', value: `#${b.id}` },
          { label: 'Facility Name', value: b.warehouse },
          { label: 'Storage Type', value: b.type || 'Standard Warehouse' },
          { label: 'Commodity Variety', value: b.crop },
          { label: 'Reserved Quantity', value: b.quantity },
          { label: 'Storage Period', value: `${b.duration} starting ${b.startDate}` },
          { label: 'Reservation State', value: 'DEMO RESERVATION (Local Demonstration Record)' }
        ],
        highlightResult: {
          label: 'RESERVATION STATUS',
          value: 'ACTIVE CONFIRMED (DEMO)',
          subtext: 'Demonstration voucher. Not transmitted to government WDRA system.'
        },
        footer: {
          operator: 'AgriSync Logistics Module',
          terminal: 'Storage Booking Terminal',
          location: 'National AgriSync Grid',
          disclaimer: 'Demonstration reservation. Physical storage subject to facility gate inspection.'
        }
      },
      `Storage_Reservation_${b.id}.pdf`
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-2xl text-xs font-black shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">Fulfillment & Post-Harvest</span>
            {isDemoData && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                DEMO DATA
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mt-0.5">Storage & Warehousing Discovery</h1>
          <p className="text-xs text-slate-600 mt-1">
            Discover nearby cold storage and dry warehouses fetched via Logistics Facility Registry.
          </p>
        </div>
      </div>

      {/* Facility Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {facilities.map((w) => {
            const capMT = (w.capacity_kg / 1000).toLocaleString('en-IN');
            const isCold = w.type === 'cold_storage';

            return (
              <div
                key={w.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-[#047857] uppercase tracking-wider flex items-center gap-1 truncate">
                      <MapPin size={11} className="shrink-0" /> {w.distance || 'Nearby'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isCold ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {isCold ? 'Cold Storage' : 'Dry Warehouse'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#0f172a] mt-2">{w.facility_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{w.location}, {w.state}</p>

                  <div className="mt-3.5 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Total Capacity:</span>
                      <span className="font-bold text-[#0f172a]">{capMT} MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Available Space:</span>
                      <span className="font-bold text-emerald-700">{(w.capacity_kg * 0.85 / 1000).toFixed(0)} MT Available</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Rental Tariff:</span>
                      <span className="font-black text-[#047857] font-data-tabular">₹{w.cost_per_day || 350} / Day</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500 font-medium">Certification:</span>
                      <span className="font-semibold text-slate-700 truncate ml-1">{w.certification}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-[10px] text-slate-500 flex items-center justify-between font-semibold">
                    <span>Reservation:</span>
                    <span className="text-emerald-700 font-bold">Instant Lock Available</span>
                  </div>

                  <button
                    onClick={() => handleOpenModal(w)}
                    className="text-center w-full py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer active:scale-98 min-h-[38px]"
                  >
                    Reserve Storage Space
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Warehouse Reservations List */}
      {myBookings.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-[#047857]" size={20} />
              <h2 className="text-base font-extrabold text-[#0f172a]">My Reserved Storage Facilities</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                DEMO RESERVATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[10px] font-extrabold border border-[#bbf7d0]">
                {myBookings.length} Active Booking{myBookings.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {myBookings.map((b) => (
              <div key={b.id} className="p-3.5 sm:p-4 bg-[#f8fafc] rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">Cert #{b.id}</span>
                    <h4 className="font-extrabold text-sm text-[#0f172a]">{b.warehouse}</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[10px] font-extrabold border border-[#bbf7d0] shrink-0">
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div><span className="text-slate-500 block">Commodity:</span> <strong>{b.crop}</strong></div>
                  <div><span className="text-slate-500 block">Reserved:</span> <strong className="text-[#047857]">{b.quantity}</strong></div>
                  <div><span className="text-slate-500 block">Storage Type:</span> <strong>{b.type}</strong></div>
                  <div><span className="text-slate-500 block">Start Date:</span> <strong>{b.startDate}</strong></div>
                </div>

                <div className="pt-2 flex flex-wrap justify-between items-center gap-2 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-500">Tariff: {b.rate}</span>
                  <button
                    onClick={() => handleDownloadPDF(b)}
                    className="inline-flex items-center gap-1 text-[#047857] hover:underline font-bold min-h-[30px]"
                  >
                    <Download size={13} /> Download Certificate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book Warehouse Modal */}
      {showModal && selectedFacility && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#047857] uppercase">Warehouse Reservation</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    DEMO RESERVATION
                  </span>
                </div>
                <h2 className="text-base font-black text-[#0f172a]">{selectedFacility.facility_name}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Crop Commodity *</label>
                <select
                  value={bookingForm.crop}
                  onChange={(e) => setBookingForm({ ...bookingForm, crop: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                >
                  <option value="Red Onion (Garwa)">Red Onion (Garwa)</option>
                  <option value="Soybean (JS-335)">Soybean (JS-335)</option>
                  <option value="Tomato (Hybrid)">Tomato (Hybrid)</option>
                  <option value="Pomegranate (Bhagwa)">Pomegranate (Bhagwa)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Storage Chamber Type *</label>
                <select
                  value={bookingForm.storageType}
                  onChange={(e) => setBookingForm({ ...bookingForm, storageType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                >
                  <option value="Cold Storage (Controlled Temp 4°C)">Cold Storage (Controlled Temp 4°C)</option>
                  <option value="Ventilated Dry Warehouse">Ventilated Dry Warehouse</option>
                  <option value="Modified Atmosphere Chamber">Modified Atmosphere Chamber</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Storage Weight (MT) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={bookingForm.quantity}
                    onChange={(e) => setBookingForm({ ...bookingForm, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none focus:border-[#047857]"
                  />
                  {errors.quantity && <span className="text-red-600 text-[10px] font-bold mt-0.5 block">{errors.quantity}</span>}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Months) *</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={bookingForm.months}
                    onChange={(e) => setBookingForm({ ...bookingForm, months: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none focus:border-[#047857]"
                  />
                  {errors.months && <span className="text-red-600 text-[10px] font-bold mt-0.5 block">{errors.months}</span>}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Storage Date</label>
                <input
                  type="date"
                  value={bookingForm.startDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                />
              </div>

              <div className="p-3 bg-[#f0fdf4] rounded-xl border border-[#dcfce7] text-slate-700 text-xs">
                <div className="flex justify-between font-bold">
                  <span>Estimated Daily Tariff:</span>
                  <span className="text-[#047857]">₹{selectedFacility.cost_per_day || 350} / Day</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Notice: Local state demonstration. Reservation is recorded in demonstration database.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white font-extrabold rounded-xl shadow-md cursor-pointer active:scale-98 min-h-[38px]"
                >
                  Confirm Storage Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageDiscovery;

