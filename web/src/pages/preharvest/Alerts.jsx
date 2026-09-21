import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Volume2, Filter, VolumeX, Eye, ShieldAlert, Check } from 'lucide-react';
import { playSirenSound } from '../../lib/soundEffects';

const STORAGE_KEY = 'agrisync_alerts_workflow_v3';

const DEFAULT_ALERTS = [
  {
    id: 'ALT-2026-001',
    animal: 'Wild Boar / Pig',
    camera: 'North Perimeter Node #1',
    farm: 'Rajesh Farm (Niphad)',
    zone: 'North Field - Onion Plot',
    severity: 'High',
    time: '4 mins ago',
    status: 'OPEN',
    confidence: '92% (YOLO)',
    notes: 'Perimeter fence breach detected near boundary stake #12.'
  },
  {
    id: 'ALT-2026-002',
    animal: 'Cow / Cattle',
    camera: 'East Boundary Node #2',
    farm: 'Rajesh Farm (Niphad)',
    zone: 'East Boundary - Sugarcane',
    severity: 'Medium',
    time: '26 mins ago',
    status: 'ACKNOWLEDGED',
    confidence: '86% (YOLO)',
    notes: 'Cattle grazing within buffer zone. Farmer notified via SMS.'
  },
  {
    id: 'ALT-2026-003',
    animal: 'Horse',
    camera: 'South Canal Node #3',
    farm: 'Rajesh Farm (Niphad)',
    zone: 'South Canal Perimeter',
    severity: 'Low',
    time: '2 hours ago',
    status: 'RESOLVED',
    confidence: 'Demo Stream',
    notes: 'Animal moved back across public canal track. Zero crop contact.'
  }
];

const loadAlerts = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_ALERTS;
};

const saveAlerts = (alerts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {}
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(() => loadAlerts());
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sirenActiveToast, setSirenActiveToast] = useState(null);

  // Sync with backend notifications if available
  useEffect(() => {
    const fetchBackendNotifications = async () => {
      try {
        const backendUrl = API_BASE_URL;
        const res = await fetch(`${backendUrl}/api/notifications`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : Array.isArray(data?.notifications) ? data.notifications : [];
          if (items.length > 0) {
            // merge notifications into alerts
            setAlerts((prev) => {
              const seenIds = new Set(prev.map(a => a.id));
              const newFromBackend = items
                .filter(n => !seenIds.has(n.id))
                .map((n, idx) => ({
                  id: n.id || `ALT-NOTIF-${idx}`,
                  animal: n.animal || 'Wild Animal',
                  camera: n.camera_id || 'North Perimeter Node #1',
                  farm: 'Rajesh Farm (Niphad)',
                  zone: n.zone || 'North Field',
                  severity: n.severity || 'Medium',
                  time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
                  status: n.status ? n.status.toUpperCase() : 'OPEN',
                  confidence: n.confidence ? `${n.confidence}% (YOLO)` : 'Active Event',
                  notes: n.message || 'Automated camera detection trigger'
                }));
              const combined = [...newFromBackend, ...prev];
              saveAlerts(combined);
              return combined;
            });
          }
        }
      } catch {}
    };
    fetchBackendNotifications();
  }, []);

  const handleAcknowledge = (id) => {
    setAlerts((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
      saveAlerts(updated);
      return updated;
    });
  };

  const handleResolve = (id) => {
    setAlerts((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a));
      saveAlerts(updated);
      return updated;
    });
  };

  const handleSirenClick = async (animalName) => {
    playSirenSound(3.5);
    setSirenActiveToast(`🚨 High-Decibel Siren Activated for ${animalName || 'Wild Animal'}! Automated ultrasonic deterrent dispatched.`);
    try {
      const backendUrl = API_BASE_URL;
      await fetch(`${backendUrl}/api/siren/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animal: animalName || 'wild_boar', force: true }),
      });
    } catch (e) {}

    setTimeout(() => {
      setSirenActiveToast(null);
    }, 3800);
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchSev = filterSeverity === 'All' || a.severity === filterSeverity;
    const matchStat = filterStatus === 'All' || a.status === filterStatus;
    return matchSev && matchStat;
  });

  const openCount = alerts.filter(a => a.status === 'OPEN').length;
  const ackCount = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  const resCount = alerts.filter(a => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {sirenActiveToast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-md z-50 p-3.5 sm:p-4 rounded-2xl bg-[#047857] text-white font-extrabold text-xs shadow-2xl flex items-center justify-between gap-3 border border-[#a7f3d0] animate-bounce">
          <div className="flex items-center gap-2">
            <Volume2 size={18} className="animate-spin text-[#dcfce7] shrink-0" />
            <span className="text-[11px] sm:text-xs">{sirenActiveToast}</span>
          </div>
          <button onClick={() => setSirenActiveToast(null)} className="ml-2 hover:opacity-80 font-bold p-1 cursor-pointer shrink-0">
            <VolumeX size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">Active Animal Intrusion Alerts</h1>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
              {openCount} Open Intrusion{openCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Real-time perimeter intrusion alerts dispatched from edge camera detection events. Track from Open → Acknowledged → Resolved.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
              <Filter size={13} /> Status:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-[#0f172a] outline-none min-h-[36px]"
            >
              <option value="All">All ({alerts.length})</option>
              <option value="OPEN">Open ({openCount})</option>
              <option value="ACKNOWLEDGED">Acknowledged ({ackCount})</option>
              <option value="RESOLVED">Resolved ({resCount})</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
            <span className="text-xs text-slate-500 font-bold">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full sm:w-auto text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-[#0f172a] outline-none min-h-[36px]"
            >
              <option value="All">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-2xl">
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">1. Open Threats</span>
          <strong className="text-lg sm:text-xl font-black text-red-900 mt-0.5 block">{openCount} Active</strong>
        </div>
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">2. Acknowledged</span>
          <strong className="text-lg sm:text-xl font-black text-amber-900 mt-0.5 block">{ackCount} Under Audit</strong>
        </div>
        <div className="p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl">
          <span className="text-[10px] font-bold text-[#15803d] uppercase tracking-wider block">3. Resolved</span>
          <strong className="text-lg sm:text-xl font-black text-[#15803d] mt-0.5 block">{resCount} Neutralized</strong>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3 sm:space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <ShieldAlert size={36} className="mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-700 text-sm">No Alerts in this Category</h3>
            <p className="text-xs text-slate-500">No perimeter alerts match the selected filter criteria.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isHigh = alert.severity === 'High';
            const isMedium = alert.severity === 'Medium';
            const isOpen = alert.status === 'OPEN';
            const isAck = alert.status === 'ACKNOWLEDGED';
            const isResolved = alert.status === 'RESOLVED';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-shadow shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isOpen ? 'border-red-300 bg-red-50/10' : isAck ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isHigh
                        ? 'bg-red-100 text-red-700'
                        : isMedium
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-[#dcfce7] text-[#15803d]'
                    }`}
                  >
                    <AlertTriangle size={20} />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="text-sm sm:text-base font-black text-[#0f172a]">{alert.animal || 'Wild Animal'} Intrusion</h3>

                      {/* Status Tag */}
                      <span
                        className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isOpen
                            ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                            : isAck
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                        }`}
                      >
                        ● {alert.status}
                      </span>

                      {/* Severity Tag */}
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isHigh
                            ? 'bg-red-50 text-red-600'
                            : isMedium
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {alert.severity} Severity
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      Node: <strong className="text-[#0f172a]">{alert.camera}</strong> • Zone: <strong className="text-[#047857]">{alert.zone}</strong> • {alert.time}
                    </p>
                    <p className="text-[11px] text-slate-500 italic">
                      Notes: {alert.notes}
                    </p>
                  </div>
                </div>

                {/* Multi-step Workflow Action Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  {isOpen && (
                    <>
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                      >
                        <Eye size={13} /> Acknowledge
                      </button>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[#0f172a] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 min-h-[36px]"
                      >
                        <Check size={13} /> Resolve
                      </button>
                      <button
                        onClick={() => handleSirenClick(alert.animal)}
                        title="Click to trigger siren deterrent"
                        className="w-full sm:w-auto px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 min-h-[36px]"
                      >
                        <Volume2 size={13} /> Siren
                      </button>
                    </>
                  )}

                  {isAck && (
                    <>
                      <span className="text-[11px] text-amber-700 font-bold mr-1 hidden sm:inline">Audited by Farmer</span>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 min-h-[38px]"
                      >
                        <CheckCircle2 size={14} /> Complete Resolution
                      </button>
                    </>
                  )}

                  {isResolved && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803d] bg-[#dcfce7] border border-[#bbf7d0] px-3.5 py-1.5 rounded-xl">
                      <CheckCircle2 size={14} className="text-[#047857]" /> Resolved & Logged
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
