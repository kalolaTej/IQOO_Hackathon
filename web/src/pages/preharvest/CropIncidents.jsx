import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle2, Eye, Plus, Filter, ShieldAlert, FileText, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STORAGE_KEY = 'agrisync_crop_incidents_v2';

const DEFAULT_INCIDENTS = [
  {
    id: 'INC-2024-001',
    animal: 'Wild Boar / Pig',
    farm: 'Rajesh Farm (Niphad)',
    camera: 'North Perimeter Node #1',
    zone: 'North Field - Onion Plot',
    crop: 'Red Onion (Garwa Plot #1)',
    damage: '0.0% (Deterred)',
    affected_area: '0.05 Acres (Perimeter)',
    date: '18 Sep 2026',
    time: '03:14 AM',
    severity: 'High',
    status: 'RESOLVED',
    action_taken: 'Ultrasonic acoustic deterrent siren fired within 1.2s; animal fled north.',
    claimStatus: 'Not Required'
  },
  {
    id: 'INC-2024-002',
    animal: 'Cow / Stray Cattle',
    farm: 'Rajesh Farm (Niphad)',
    camera: 'East Boundary Node #2',
    zone: 'East Boundary - Sugarcane',
    crop: 'Sugarcane (East Sector)',
    damage: '3.5% Loss',
    affected_area: '0.40 Acres',
    date: '10 Sep 2026',
    time: '11:45 PM',
    severity: 'Medium',
    status: 'ACKNOWLEDGED',
    action_taken: 'Crop loss survey completed with local taluka insurance assessor.',
    claimStatus: 'PMFBY Filed'
  },
  {
    id: 'INC-2024-003',
    animal: 'Wild Boar',
    farm: 'Rajesh Farm (Niphad)',
    camera: 'North Perimeter Node #1',
    zone: 'North Field - Onion Plot',
    crop: 'Red Onion (Garwa Plot #2)',
    damage: '1.8% Loss',
    affected_area: '0.25 Acres',
    date: '02 Sep 2026',
    time: '02:10 AM',
    severity: 'High',
    status: 'OPEN',
    action_taken: 'Pending farmer field survey & photographic evidence verification.',
    claimStatus: 'Under Review'
  }
];

const loadIncidents = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_INCIDENTS;
};

const saveIncidents = (incidents) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
  } catch {}
};

export const CropIncidents = () => {
  const { session } = useAuth();
  const [incidents, setIncidents] = useState(() => loadIncidents());
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newIncident, setNewIncident] = useState({
    crop: 'Red Onion (Garwa Plot #1)',
    animal: 'Wild Boar',
    camera: 'North Perimeter Node #1',
    zone: 'North Field - Onion Plot',
    affected_area: '0.3 Acres',
    damage: '2.0% Crop Loss',
    severity: 'High',
    date: new Date().toISOString().split('T')[0],
    time: '02:30 AM',
    notes: 'Perimeter fence breach evidence recorded.',
    fileClaim: true
  });
  const [errors, setErrors] = useState({});

  // Sync with backend GET /api/incidents if online
  useEffect(() => {
    const fetchBackendIncidents = async () => {
      try {
        const backendUrl = API_BASE_URL;
        const headers = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        const res = await fetch(`${backendUrl}/api/incidents`, { headers });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
          if (items.length > 0) {
            setIncidents((prev) => {
              const seenIds = new Set(prev.map(i => i.id));
              const fromBackend = items
                .filter(i => !seenIds.has(i.id))
                .map((i, idx) => ({
                  id: i.id || `INC-BE-${idx}`,
                  animal: i.animal || 'Wild Boar',
                  farm: 'Rajesh Farm (Niphad)',
                  camera: i.camera_id || 'North Perimeter Node #1',
                  zone: i.zone || 'North Field - Onion Plot',
                  crop: i.crop_type || 'Red Onion',
                  damage: i.affected_area_estimate || '1.5% Loss',
                  affected_area: i.affected_area_estimate || '0.2 Acres',
                  date: i.reported_at ? new Date(i.reported_at).toISOString().split('T')[0] : 'Today',
                  time: i.reported_at ? new Date(i.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '02:30 AM',
                  severity: i.severity ? i.severity.charAt(0).toUpperCase() + i.severity.slice(1) : 'Medium',
                  status: (i.status || 'OPEN').toUpperCase(),
                  action_taken: i.notes || 'Incident recorded via camera log.',
                  claimStatus: i.confirmed_by_farmer ? 'PMFBY Claim Logged' : 'Pending Confirmation'
                }));
              const merged = [...fromBackend, ...prev];
              saveIncidents(merged);
              return merged;
            });
          }
        }
      } catch {}
    };
    fetchBackendIncidents();
  }, [session]);

  const handleAcknowledge = (id) => {
    setIncidents((prev) => {
      const updated = prev.map((inc) =>
        inc.id === id
          ? { ...inc, status: 'ACKNOWLEDGED', action_taken: 'Field audit acknowledged by farmer. Evidence locked for claim inspection.' }
          : inc
      );
      saveIncidents(updated);
      return updated;
    });
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident(prev => ({ ...prev, status: 'ACKNOWLEDGED' }));
    }
  };

  const handleResolve = (id) => {
    setIncidents((prev) => {
      const updated = prev.map((inc) =>
        inc.id === id
          ? { ...inc, status: 'RESOLVED', action_taken: 'Perimeter repaired & PMFBY settlement documentation finalized.' }
          : inc
      );
      saveIncidents(updated);
      return updated;
    });
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident(prev => ({ ...prev, status: 'RESOLVED' }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!newIncident.animal.trim()) errs.animal = 'Animal species is required.';
    if (!newIncident.affected_area.trim()) errs.affected_area = 'Affected area is required.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const created = {
      id: `INC-2024-${Math.floor(100 + Math.random() * 900)}`,
      animal: newIncident.animal,
      farm: 'Rajesh Farm (Niphad)',
      camera: newIncident.camera,
      zone: newIncident.zone,
      crop: newIncident.crop,
      damage: newIncident.damage,
      affected_area: newIncident.affected_area,
      date: newIncident.date,
      time: newIncident.time,
      severity: newIncident.severity,
      status: 'OPEN',
      action_taken: newIncident.notes || 'Logged by farm operator. Awaiting field inspection.',
      claimStatus: newIncident.fileClaim ? 'PMFBY Evidence Claim Filed' : 'Logged (Audit Only)'
    };

    const updated = [created, ...incidents];
    setIncidents(updated);
    saveIncidents(updated);
    setShowCreateModal(false);
    setErrors({});

    // Attempt pushing to backend POST /api/incidents
    try {
      const backendUrl = API_BASE_URL;
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      await fetch(`${backendUrl}/api/incidents`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          crop_type: newIncident.crop,
          affected_area_estimate: newIncident.affected_area,
          notes: `${newIncident.animal} intrusion: ${newIncident.notes}`,
          severity: newIncident.severity.toLowerCase()
        })
      });
    } catch {}
  };

  const filteredIncidents = incidents.filter(
    (inc) => filterStatus === 'All' || inc.status === filterStatus
  );

  const openCount = incidents.filter(i => i.status === 'OPEN').length;
  const ackCount = incidents.filter(i => i.status === 'ACKNOWLEDGED').length;
  const resCount = incidents.filter(i => i.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">Crop Protection Field Incidents & Claims</h1>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {openCount} Open Incident{openCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Pre-harvest intrusion evidence logging, status lifecycle (Open → Acknowledged → Resolved), and PMFBY crop insurance claims.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
              <Filter size={13} /> Filter:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[#0f172a] outline-none"
            >
              <option value="All">All Incidents ({incidents.length})</option>
              <option value="OPEN">Open ({openCount})</option>
              <option value="ACKNOWLEDGED">Acknowledged ({ackCount})</option>
              <option value="RESOLVED">Resolved ({resCount})</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-extrabold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>+ Log Field Incident</span>
          </button>
        </div>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-2xl">
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Open Incidents</span>
          <strong className="text-xl font-black text-red-900 mt-0.5 block font-data-tabular">{openCount} Cases</strong>
        </div>
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Acknowledged</span>
          <strong className="text-xl font-black text-amber-900 mt-0.5 block font-data-tabular">{ackCount} Cases</strong>
        </div>
        <div className="p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl">
          <span className="text-[10px] font-bold text-[#15803d] uppercase tracking-wider block">Resolved</span>
          <strong className="text-xl font-black text-[#15803d] mt-0.5 block font-data-tabular">{resCount} Cases</strong>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-[#dcfce7] text-[11px] font-extrabold uppercase tracking-wider">
                <th className="p-4">Incident ID</th>
                <th className="p-4">Crop & Field Zone</th>
                <th className="p-4">Species / Cause</th>
                <th className="p-4">Damage / Area</th>
                <th className="p-4">Lifecycle Status</th>
                <th className="p-4">Insurance Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-[#0f172a]">
              {filteredIncidents.map((row) => {
                const isOpen = row.status === 'OPEN';
                const isAck = row.status === 'ACKNOWLEDGED';
                const isResolved = row.status === 'RESOLVED';

                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors font-medium">
                    <td className="p-4 font-black font-data-tabular text-[#047857]">{row.id}</td>
                    <td className="p-4">
                      <strong className="text-[#0f172a] block">{row.crop}</strong>
                      <span className="text-[11px] text-slate-500">{row.zone}</span>
                    </td>
                    <td className="p-4 font-bold text-[#0f172a]">
                      {row.animal}
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-[#0f172a] block">{row.damage}</span>
                      <span className="text-[11px] text-slate-500 font-normal">{row.affected_area}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isOpen
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : isAck
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                      }`}>
                        ● {row.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                        {row.claimStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => {
                          setSelectedIncident(row);
                          setShowDetailModal(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#0f172a] rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={12} /> Details
                      </button>

                      {isOpen && (
                        <button
                          onClick={() => handleAcknowledge(row.id)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={12} /> Acknowledge
                        </button>
                      )}

                      {isAck && (
                        <button
                          onClick={() => handleResolve(row.id)}
                          className="px-2.5 py-1 bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#15803d] border border-[#bbf7d0] rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 size={12} /> Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {showDetailModal && selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#047857] text-2xl">shield</span>
                <div>
                  <h2 className="text-base font-black text-[#0f172a]">Incident Record: {selectedIncident.id}</h2>
                  <span className="text-[11px] text-slate-500 font-medium">{selectedIncident.date} at {selectedIncident.time}</span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div><span className="text-slate-500 block">Intruding Species:</span> <strong className="text-sm text-[#0f172a]">{selectedIncident.animal}</strong></div>
                <div><span className="text-slate-500 block">Severity Tier:</span> <strong className="text-[#047857]">{selectedIncident.severity} Severity</strong></div>
                <div><span className="text-slate-500 block">Affected Crop:</span> <strong>{selectedIncident.crop}</strong></div>
                <div><span className="text-slate-500 block">Damage & Area:</span> <strong>{selectedIncident.damage} ({selectedIncident.affected_area})</strong></div>
                <div><span className="text-slate-500 block">Camera Node:</span> <span>{selectedIncident.camera}</span></div>
                <div><span className="text-slate-500 block">Field Zone:</span> <span>{selectedIncident.zone}</span></div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Action Taken & Field Response:</span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">{selectedIncident.action_taken}</p>
              </div>

              <div className="p-3 bg-[#f0fdf4] rounded-xl border border-[#dcfce7] flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Insurance Status</span>
                  <strong className="text-[#15803d]">{selectedIncident.claimStatus}</strong>
                </div>
                <span className="px-2.5 py-1 bg-white text-[#047857] font-extrabold text-[10px] rounded-lg border border-[#bbf7d0]">
                  Status: {selectedIncident.status}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="space-x-2">
                {selectedIncident.status === 'OPEN' && (
                  <button
                    onClick={() => handleAcknowledge(selectedIncident.id)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    Acknowledge Incident
                  </button>
                )}
                {selectedIncident.status === 'ACKNOWLEDGED' && (
                  <button
                    onClick={() => handleResolve(selectedIncident.id)}
                    className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#047857] text-2xl">shield</span>
                <h2 className="text-lg font-black text-[#0f172a]">Log Field Intrusion Incident</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Field Plot & Crop Variety *</label>
                <select
                  value={newIncident.crop}
                  onChange={(e) => setNewIncident({...newIncident, crop: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                >
                  <option value="Red Onion (Garwa Plot #1)">Red Onion (Garwa Plot #1)</option>
                  <option value="Soybean (East Plot #2)">Soybean (East Plot #2)</option>
                  <option value="Pomegranate (South Orchard #4)">Pomegranate (South Orchard #4)</option>
                  <option value="Wheat (North Field Plot #3)">Wheat (North Field Plot #3)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Intruding Species *</label>
                  <select
                    value={newIncident.animal}
                    onChange={(e) => setNewIncident({...newIncident, animal: e.target.value})}
                    className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                  >
                    <option value="Wild Boar">Wild Boar / Pig</option>
                    <option value="Cow / Cattle">Cow / Stray Cattle</option>
                    <option value="Elephant">Elephant</option>
                    <option value="Nilgai">Nilgai / Blue Bull</option>
                    <option value="Horse">Horse</option>
                    <option value="Goat">Goat / Sheep</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Associated Camera Node</label>
                  <select
                    value={newIncident.camera}
                    onChange={(e) => setNewIncident({...newIncident, camera: e.target.value})}
                    className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                  >
                    <option value="North Perimeter Node #1">North Perimeter Node #1</option>
                    <option value="East Boundary Node #2">East Boundary Node #2</option>
                    <option value="South Canal Node #3">South Canal Node #3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Affected Area *</label>
                  <input
                    type="text"
                    placeholder="e.g. 0.25 Acres"
                    value={newIncident.affected_area}
                    onChange={(e) => setNewIncident({...newIncident, affected_area: e.target.value})}
                    className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none focus:border-[#047857]"
                  />
                  {errors.affected_area && <span className="text-red-600 text-[10px] font-bold mt-0.5 block">{errors.affected_area}</span>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Damage Estimate</label>
                  <input
                    type="text"
                    placeholder="e.g. 2.0% Crop Loss"
                    value={newIncident.damage}
                    onChange={(e) => setNewIncident({...newIncident, damage: e.target.value})}
                    className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none focus:border-[#047857]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Field Observations & Notes</label>
                <textarea
                  rows="2"
                  placeholder="Notes on perimeter damage, tracks, or deterrent response..."
                  value={newIncident.notes}
                  onChange={(e) => setNewIncident({...newIncident, notes: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-medium text-[#0f172a] outline-none focus:border-[#047857]"
                />
              </div>

              <div className="p-3 bg-[#f0fdf4] rounded-xl border border-[#dcfce7]">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#166534]">
                  <input
                    type="checkbox"
                    checked={newIncident.fileClaim}
                    onChange={(e) => setNewIncident({...newIncident, fileClaim: e.target.checked})}
                    className="accent-[#047857]"
                  />
                  <span>File PMFBY Crop Insurance Evidence Claim</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#047857] text-white font-extrabold rounded-xl hover:bg-[#065f46] shadow-md"
                >
                  + Log Incident Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropIncidents;
