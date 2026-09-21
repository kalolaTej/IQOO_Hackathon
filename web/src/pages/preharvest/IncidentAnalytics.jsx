import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import React, { useState, useEffect } from 'react';
import { Shield, Video, AlertTriangle, Activity, CheckCircle2, RefreshCw, BarChart2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const IncidentAnalytics = () => {
  const [stats, setStats] = useState({
    activeCameras: 3,
    totalCameras: 4,
    detectionsToday: 6,
    activeAlerts: 2,
    openIncidents: 1,
    mostDetectedAnimal: 'Wild Boar / Pig (64%)',
    deterrenceRate: '96.4%'
  });

  const [recentDetections, setRecentDetections] = useState([
    { id: 'DET-2026-091', animal: 'Wild Boar', zone: 'North Field - Onion Plot', time: '18 mins ago', confidence: '92% (YOLO)', status: 'Alert Dispatched', isDemo: false },
    { id: 'DET-2026-088', animal: 'Cow / Cattle', zone: 'East Boundary - Sugarcane', time: '1 hr 25 mins ago', confidence: '88% (YOLO)', status: 'Acknowledged', isDemo: false },
    { id: 'DET-2026-074', animal: 'Horse', zone: 'South Canal Perimeter', time: '5 hrs ago', confidence: 'Demo Benchmark', status: 'Resolved', isDemo: true },
  ]);

  const [refreshing, setRefreshing] = useState(false);

  const fetchBackendData = async () => {
    setRefreshing(true);
    try {
      const backendUrl = API_BASE_URL;
      const [camRes, detRes, incRes] = await Promise.allSettled([
        fetch(`${backendUrl}/api/cameras`),
        fetch(`${backendUrl}/api/detections?limit=10`),
        fetch(`${backendUrl}/api/incidents`)
      ]);

      let totalCams = 4;
      let onlineCams = 3;
      if (camRes.status === 'fulfilled' && camRes.value.ok) {
        const camData = await camRes.value.json();
        const camList = Array.isArray(camData) ? camData : camData?.data || [];
        if (camList.length > 0) {
          totalCams = camList.length;
          onlineCams = camList.filter(c => c.status === 'online' || c.status === true).length;
        }
      }

      if (detRes.status === 'fulfilled' && detRes.value.ok) {
        const detData = await detRes.value.json();
        const detList = Array.isArray(detData) ? detData : detData?.data || [];
        if (detList.length > 0) {
          setRecentDetections(detList.slice(0, 4).map(d => ({
            id: d.id || 'DET-01',
            animal: d.animal || 'Wild Boar',
            zone: d.zone || (d.cameras && d.cameras.zone) || 'North Field',
            time: d.detected_at ? new Date(d.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            confidence: d.source === 'real' || d.source === 'yolo' ? `${d.confidence}% (YOLO)` : 'Demo Benchmark',
            status: 'Logged',
            isDemo: d.source !== 'real' && d.source !== 'yolo'
          })));
        }
      }

      setStats(prev => ({
        ...prev,
        activeCameras: onlineCams,
        totalCameras: totalCams
      }));
    } catch {}
    finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">Pre-Harvest Protection & Intrusion Summary</h1>
            <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              DEMO DATA / TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Unified telemetry overview of edge IoT camera nodes, YOLO11n detection events, acoustic deterrent status, and crop loss claims.
          </p>
        </div>

        <button
          onClick={fetchBackendData}
          disabled={refreshing}
          className="px-3.5 py-2.5 bg-white border border-slate-200 text-[#0f172a] text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto min-h-[38px]"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#047857]' : ''} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Cameras */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Edge Nodes Online</span>
            <Video size={16} className="text-[#047857]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0f172a] font-data-tabular">
            {stats.activeCameras} / {stats.totalCameras} Active
          </div>
          <div className="text-[11px] text-[#15803d] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse"></span>
            <span>RTSP Streams Active</span>
          </div>
        </div>

        {/* Detections Today */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Detections Today</span>
            <Activity size={16} className="text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0f172a] font-data-tabular">
            {stats.detectionsToday} Breaches
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            <span>YOLO11n Edge Ingestion</span>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Active Alerts</span>
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-700 font-data-tabular">
            {stats.activeAlerts} Threats
          </div>
          <Link to="/alerts" className="text-[11px] text-red-700 font-bold hover:underline flex items-center gap-1 min-h-[24px]">
            <span>Review Alerts →</span>
          </Link>
        </div>

        {/* Open Incidents */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Open Field Cases</span>
            <Shield size={16} className="text-[#047857]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0f172a] font-data-tabular">
            {stats.openIncidents} Case
          </div>
          <Link to="/protect/incidents" className="text-[11px] text-[#047857] font-bold hover:underline flex items-center gap-1 min-h-[24px]">
            <span>PMFBY Claims →</span>
          </Link>
        </div>
      </div>

      {/* Two Column Section: Recent Detections + Animal Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Detections List */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#047857]" />
              <h3 className="font-extrabold text-sm text-[#0f172a]">Recent Perimeter Infiltration Events</h3>
            </div>
            <Link to="/detections" className="text-xs text-[#047857] font-bold hover:underline min-h-[30px] flex items-center">
              View All Logs →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentDetections.map((d, i) => (
              <div key={d.id || i} className="py-2.5 flex items-center justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <strong className="text-[#0f172a] capitalize truncate">{d.animal}</strong>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      d.isDemo
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                    }`}>
                      {d.confidence}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block mt-0.5 truncate">{d.zone} • {d.time}</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px] shrink-0">
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Intrusion Frequency by Animal Type */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-[#047857]" />
              <h3 className="font-extrabold text-sm text-[#0f172a]">Infiltration Distribution by Target Class</h3>
            </div>
            <Link to="/protect/animals" className="text-xs text-[#047857] font-bold hover:underline min-h-[30px] flex items-center">
              Target Settings →
            </Link>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div>
              <div className="flex justify-between mb-1 font-bold text-[#0f172a] text-[11px] sm:text-xs">
                <span className="truncate">Wild Boar / Pig (Most Detected)</span>
                <span className="font-black text-[#047857] shrink-0 ml-2">64% (18 Events)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#047857] h-full rounded-full w-[64%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-bold text-[#0f172a] text-[11px] sm:text-xs">
                <span className="truncate">Cow / Stray Cattle</span>
                <span className="font-black text-slate-700 shrink-0 ml-2">25% (7 Events)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#166534] h-full rounded-full w-[25%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-bold text-[#0f172a] text-[11px] sm:text-xs">
                <span className="truncate">Horse / Nilgai</span>
                <span className="font-black text-slate-700 shrink-0 ml-2">11% (3 Events)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#10b981] h-full rounded-full w-[11%]"></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-500 font-medium">
            <span>Deterrence Success: <strong className="text-[#15803d] font-bold">{stats.deterrenceRate}</strong></span>
            <span>Acoustic Siren Dispatches: <strong className="text-[#0f172a]">27</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentAnalytics;
