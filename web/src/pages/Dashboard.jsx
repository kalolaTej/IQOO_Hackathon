import { API_BASE_URL, SOCKET_URL } from '../lib/api';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Camera, ShieldAlert, Volume2, Radio, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAnimalImage } from '../lib/animalImages';
import { getImageUrl, resolveCameraStreamUrl } from '../lib/imageUtils';
import { playSirenSound } from '../lib/soundEffects';

export const Dashboard = () => {
  const { user, t, getRoleLabel } = useAuth();
  const navigate = useNavigate();

  // Perimeter Camera State
  const [perimeterCam, setPerimeterCam] = useState({
    cameraId: 'cam_01',
    cameraName: 'North Perimeter Cam',
    zone: 'North Field - Onion Plot',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200',
    capturedAt: new Date().toISOString(),
    detectionStatus: 'no_animal',
    status: 'online',
    fps: 30,
  });
  const [capturing, setCapturing] = useState(false);

  // Detection History State
  const [detections, setDetections] = useState([]);
  const [loadingDetections, setLoadingDetections] = useState(true);

  // Siren Status State
  const [sirenState, setSirenState] = useState({ active: false, animal: null, inCooldown: false });
  const [triggeringSiren, setTriggeringSiren] = useState(false);

  // Live Market Price State
  const [marketSummary, setMarketSummary] = useState({
    crop: 'Red Onion',
    market: 'Pimpalgaon APMC',
    modalPrice: 2420,
    minPrice: 1850,
    maxPrice: 2650,
    isLive: false,
    source: 'data.gov.in',
    date: new Date().toISOString().split('T')[0],
  });

  // Slot Info State
  const [slotInfo, setSlotInfo] = useState({
    token: '#B-14',
    time: 'Tomorrow, 08:30 AM',
    mandi: 'Pimpalgaon APMC Yard #2',
    driver: 'Dattatray Shinde (MH-15-EG-4412)',
    ahead: '12 vehicles ahead • Est. wait ~40 min',
  });

  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const [slotForm, setSlotForm] = useState({
    mandi: 'Pimpalgaon APMC Yard #2',
    lot: '',
    date: '2026-09-20',
    timeWindow: '08:30 AM - 09:15 AM',
    driver: 'Dattatray Shinde (MH-15-EG-4412)',
  });

  const [newTime, setNewTime] = useState('Tomorrow, 11:00 AM');
  const [produceBatches, setProduceBatches] = useState([]);
  const [loadingProduce, setLoadingProduce] = useState(true);

  const backendUrl = API_BASE_URL;

  // 1. Fetch Latest Perimeter Camera Frame
  const fetchPerimeterFrame = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/camera/perimeter-latest`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPerimeterCam(json.data);
        }
      }
    } catch (e) {
      console.warn('[Dashboard] Could not fetch perimeter frame:', e);
    }
  }, [backendUrl]);

  // 2. Fetch Detection History
  const fetchDetections = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/detections?limit=6`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data || [];
        setDetections(items);
      }
    } catch (e) {
      console.warn('[Dashboard] Could not fetch detections:', e);
    } finally {
      setLoadingDetections(false);
    }
  }, [backendUrl]);

  // 3. Fetch Market Price Summary
  const fetchMarketSummary = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/market-prices/single?crop=onion`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setMarketSummary(json.data);
        }
      }
    } catch (e) {
      console.warn('[Dashboard] Could not fetch market summary:', e);
    }
  }, [backendUrl]);

  // 4. Fetch Siren State
  const fetchSirenStatus = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/siren/status`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSirenState(json.data);
        }
      }
    } catch (e) {
      console.warn('[Dashboard] Could not fetch siren status:', e);
    }
  }, [backendUrl]);

  // 5. Fetch Produce Lots
  const fetchProduceLots = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/produce`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data || [];
        setProduceBatches(items);
        if (items.length > 0 && !slotForm.lot) {
          const first = items[0];
          setSlotForm((prev) => ({
            ...prev,
            lot: `${first.lot_number || first.id} (${first.crop} ${first.quantity} ${first.unit || 'kg'})`,
          }));
        }
      }
    } catch (e) {
      console.warn('[Dashboard] Could not fetch produce:', e);
    } finally {
      setLoadingProduce(false);
    }
  }, [backendUrl]);

  // Setup Initial Fetch & Socket.IO Realtime Listeners
  useEffect(() => {
    fetchPerimeterFrame();
    fetchDetections();
    fetchMarketSummary();
    fetchSirenStatus();
    fetchProduceLots();

    const socket = io(SOCKET_URL || backendUrl || (typeof window !== 'undefined' ? window.location.origin : ''), { transports: ['websocket', 'polling'] });

    socket.on('perimeter-updated', (frame) => {
      if (frame) {
        setPerimeterCam(frame);
      }
    });

    socket.on('new-detection', (newDet) => {
      if (newDet) {
        setDetections((prev) => [newDet, ...prev.filter((d) => d.id !== newDet.id)].slice(0, 6));
      }
    });

    socket.on('detections_cleared', () => {
      setDetections([]);
    });

    socket.on('detection_deleted', ({ id }) => {
      if (id) {
        setDetections((prev) => prev.filter((d) => d.id !== id));
      }
    });

    socket.on('siren-triggered', (sirenEvt) => {
      if (sirenEvt) {
        setSirenState(sirenEvt.state || { active: true, animal: sirenEvt.animal });
      }
    });

    socket.on('siren-status', (status) => {
      if (status) {
        setSirenState(status);
      }
    });

    const pollInterval = setInterval(() => {
      fetchPerimeterFrame();
      fetchSirenStatus();
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, [backendUrl, fetchPerimeterFrame, fetchDetections, fetchMarketSummary, fetchSirenStatus]);

  // Manual Trigger: Capture Camera Frame Now
  const handleManualCapture = async () => {
    setCapturing(true);
    try {
      const res = await fetch(`${backendUrl}/api/camera/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camera_id: perimeterCam.cameraId || 'cam_01' }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.latestPerimeter) {
          setPerimeterCam(json.latestPerimeter);
        }
        fetchDetections();
        fetchSirenStatus();
      }
    } catch (e) {
      console.error('Manual capture failed:', e);
    } finally {
      setCapturing(false);
    }
  };

  // Manual Trigger: Siren Test
  const handleManualSiren = async () => {
    setTriggeringSiren(true);
    // 1. Play real audible sound on browser speakers
    playSirenSound(3.5);
    // 2. Set active alert banner immediately in state
    setSirenState({ active: true, animal: 'Wild Boar (Manual Test)', inCooldown: false });
    try {
      const res = await fetch(`${backendUrl}/api/siren/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animal: 'wild_boar', force: true }),
      });
      if (res.ok) {
        fetchSirenStatus();
      }
    } catch (e) {
      console.error('Siren trigger failed:', e);
    } finally {
      setTimeout(() => {
        setTriggeringSiren(false);
      }, 3500);
    }
  };

  const handleBookSlotSubmit = (e) => {
    e.preventDefault();
    const newTokenNum = Math.floor(15 + Math.random() * 10);
    setSlotInfo({
      token: `#B-${newTokenNum}`,
      time: `${slotForm.date === '2026-09-20' ? 'Tomorrow' : slotForm.date}, ${slotForm.timeWindow.split(' - ')[0]}`,
      mandi: slotForm.mandi,
      driver: slotForm.driver,
      ahead: '4 vehicles ahead • Est. wait ~15 min',
    });
    setShowSlotModal(false);
    navigate('/mandi/queue');
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    setSlotInfo({
      ...slotInfo,
      time: newTime,
    });
    setShowRescheduleModal(false);
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Greeting & Top Bar Actions */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">{t('dash.welcome', 'Welcome back')}, {user.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-xs font-bold border border-[#bbf7d0]">
              {getRoleLabel(user?.role)}
            </span>
          </div>
          <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
            <span className="material-symbols-outlined text-sm text-[#047857]">wb_sunny</span>
            <span className="truncate">{user?.apmc || user?.location || 'Registered Farmland'} • 30s IoT Surveillance Active</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowSlotModal(true)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white text-[#0f172a] rounded-xl text-xs font-bold border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-[#047857]">calendar_month</span>
            <span>{t('dash.bookSlot', 'Book Mandi Slot')}</span>
          </button>
          <Link
            to="/produce"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#047857] text-white rounded-xl text-xs font-extrabold shadow-md hover:bg-[#065f46] transition-colors"
          >
            <span className="material-symbols-outlined text-base">add_box</span>
            <span>{t('dash.createLot', '+ Add Produce')}</span>
          </Link>
        </div>
      </section>

      {/* Siren Active Alert Banner (Shows when siren is triggered) */}
      {sirenState?.active && (
        <div className="bg-red-600 text-white rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white text-red-600 flex items-center justify-center font-black shrink-0">
              <Volume2 className="animate-bounce" size={22} />
            </div>
            <div>
              <div className="font-black text-xs sm:text-sm uppercase tracking-wide flex flex-wrap items-center gap-2">
                <span>AUTOMATED DETERRENT SIREN ACTIVATED!</span>
                <span className="px-2 py-0.5 rounded-full bg-red-800 text-yellow-300 text-[9px] sm:text-[10px] font-black tracking-normal border border-red-400">
                  {sirenState?.mode === 'PHYSICAL' || sirenState?.hardwareResult?.startsWith('esp32_ack')
                    ? 'PHYSICAL (ESP32 ACK)'
                    : 'SIMULATION'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-red-100 mt-0.5">
                Animal Intrusion [{sirenState.animal || 'Wild Boar'}] detected on field perimeter. High-decibel deterrent active.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-red-800 text-white text-[10px] sm:text-xs font-bold rounded-lg shrink-0 self-start sm:self-auto">
            SIREN SOUNDING
          </span>
        </div>
      )}

      {/* Core Operational Section: LIVE PERIMETER CAMERA & DETECTION HISTORY */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Live Perimeter Camera Feed (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Camera size={16} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-[#0f172a] truncate">Live Field Perimeter Camera</h2>
                  <p className="text-[11px] text-slate-500 truncate">{perimeterCam.cameraName} • {perimeterCam.zone}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold ${
                  perimeterCam.status === 'online'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${perimeterCam.status === 'online' ? 'bg-emerald-600 animate-ping' : 'bg-red-600'}`}></span>
                  <span>{perimeterCam.status === 'online' ? 'Live' : 'Offline'}</span>
                </span>

                <button
                  onClick={handleManualCapture}
                  disabled={capturing}
                  className="p-1.5 text-slate-500 hover:text-[#047857] hover:bg-slate-100 rounded-lg border border-slate-200 text-xs flex items-center gap-1 font-bold cursor-pointer"
                  title="Trigger instant frame capture & AI analysis"
                >
                  <RefreshCw size={13} className={capturing ? 'animate-spin text-[#047857]' : ''} />
                  <span className="hidden sm:inline">Capture Now</span>
                </button>
              </div>
            </div>

            {/* Camera Viewport */}
            <div className="mt-4 relative rounded-2xl overflow-hidden bg-slate-950 aspect-video shadow-inner flex items-center justify-center group w-full">
              <img
                src={resolveCameraStreamUrl({
                  ...perimeterCam,
                  latest_frame: perimeterCam.imageUrl,
                })}
                alt="Perimeter Camera Frame"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/uploads/detections/sample_wild_boar.jpg';
                }}
              />

              {/* Viewport Overlay Info */}
              <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[10px] font-mono border border-slate-700/60 flex items-center gap-1.5">
                <Radio size={11} className="text-emerald-400 animate-pulse" />
                <span>REC: {new Date(perimeterCam.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>

              <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[10px] font-bold border border-slate-700/60">
                {perimeterCam.detectionStatus === 'animal_detected' ? (
                  <span className="text-red-400 font-extrabold flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Intrusion Detected
                  </span>
                ) : (
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Clear
                  </span>
                )}
              </div>

              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-slate-300 text-[10px] sm:text-[11px] flex items-center justify-between border border-slate-800">
                <span className="truncate">Auto Scheduler: <strong className="text-emerald-400 font-bold">Active</strong></span>
                <span>FPS: <strong className="text-white font-bold">{perimeterCam.fps || 30}</strong></span>
                <span className="hidden xs:inline">Node: <strong className="text-white font-bold">{perimeterCam.cameraId}</strong></span>
              </div>
            </div>
          </div>

          {/* Camera Actions Footer */}
          <div className="pt-2 flex flex-wrap items-center justify-between border-t border-slate-100 text-xs gap-2">
            <span className="text-slate-500 font-medium text-[11px]">
              Last Frame: <strong className="text-slate-800 font-bold">{new Date(perimeterCam.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSiren}
                disabled={triggeringSiren}
                className="px-2.5 sm:px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Volume2 size={12} />
                <span>Test Siren</span>
              </button>
              <Link to="/cameras" className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors flex items-center gap-1 text-[11px]">
                <span>All Cameras</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Animal Detection History (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#0f172a]">Animal Detection History</h2>
                  <p className="text-[11px] text-slate-500">Persisted in database • Real-time alerts</p>
                </div>
              </div>

              <Link to="/detections" className="text-xs text-[#047857] font-bold hover:underline shrink-0">
                View All →
              </Link>
            </div>

            {/* Detections List */}
            <div className="mt-3 space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {loadingDetections ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : detections.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="font-bold">No Animal Intrusions Recorded</p>
                  <p className="text-[11px] text-slate-400">Your perimeter fence is clear and secure.</p>
                </div>
              ) : (
                detections.map((det, idx) => {
                  const animalName = det.animal || det.detected_animal || 'Wild Animal';
                  const conf = det.confidence ? `${Math.round(det.confidence)}%` : '90%';
                  const detectedTime = det.detected_at || det.created_at || new Date().toISOString();
                  const imgUrl = getAnimalImage(animalName, det.processed_image_url || det.image_url);

                  return (
                    <div
                      key={det.id || idx}
                      className="p-2.5 sm:p-3 bg-[#f8fafc] hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-all flex items-center gap-2.5 sm:gap-3"
                    >
                      <img
                        src={imgUrl}
                        alt={animalName}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover bg-slate-200 shrink-0 border border-slate-300/60"
                        onError={(e) => {
                          e.target.src = getAnimalImage(animalName);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-xs text-[#0f172a] capitalize truncate">
                            {animalName.replace(/_/g, ' ')}
                          </span>
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[9px] sm:text-[10px] font-black shrink-0">
                            {conf}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                          <span className="truncate">{det.camera_id || 'North Cam'}</span>
                          <span className="font-mono text-slate-400 shrink-0">{new Date(detectedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <button
                onClick={handleManualSiren}
                disabled={triggeringSiren}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Test Deterrent Siren & Play Audio"
              >
                <Volume2 size={13} className={triggeringSiren ? 'animate-spin' : ''} />
                <span>{triggeringSiren ? 'Siren Sounding...' : 'Test Siren'}</span>
              </button>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Auto Cooldown: <strong>30s</strong></span>
              </span>
            </div>
            <Link to="/alerts" className="text-[#047857] font-extrabold hover:underline text-xs">
              Alerts Console →
            </Link>
          </div>
        </div>
      </section>

      {/* Core Status Summary Tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Active Lots Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Active Produce Lots</span>
              <span className="w-8 h-8 rounded-xl bg-[#dcfce7] flex items-center justify-center text-[#047857]">
                <span className="material-symbols-outlined text-xl">inventory_2</span>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-black text-[#0f172a]">
                {loadingProduce ? '...' : `${produceBatches.length} ${produceBatches.length === 1 ? 'Batch' : 'Batches'}`}
              </span>
              {!loadingProduce && produceBatches.length > 0 && (
                <span className="text-xs text-slate-500 font-bold">
                  ({(produceBatches.reduce((acc, b) => {
                    const q = parseFloat(b.quantity || b.qty || 0);
                    const u = String(b.unit || 'kg').toLowerCase();
                    if (u.includes('mt') || u.includes('ton')) return acc + q;
                    if (u.includes('qtl') || u.includes('quintal')) return acc + (q / 10);
                    return acc + (q / 1000);
                  }, 0)).toFixed(1)} MT Total)
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
              <span>
                {produceBatches.filter(b => b.grade && b.grade !== 'Pending' && b.grade !== 'Not Graded').length} Graded & Ready
              </span>
              <span>•</span>
              <span>
                {produceBatches.filter(b => !b.grade || b.grade === 'Pending' || b.grade === 'Not Graded').length} In Testing
              </span>
            </div>
          </div>
          <Link to="/produce" className="text-xs text-[#047857] font-extrabold flex items-center gap-1 hover:underline pt-1">
            <span>View My Produce</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {/* Procurement Slot Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Procurement Slot</span>
              <span className="w-8 h-8 rounded-xl bg-[#dcfce7] flex items-center justify-center text-[#047857]">
                <span className="material-symbols-outlined text-xl">schedule</span>
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-[#0f172a]">{slotInfo.time}</span>
            </div>
            <div className="mt-1 text-xs text-slate-800 font-bold">
              Token {slotInfo.token} • {slotInfo.mandi}
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-[#166534] bg-[#dcfce7] border border-[#bbf7d0] px-2.5 py-1 rounded-lg w-fit font-bold">
              <span className="material-symbols-outlined text-xs text-[#047857]">group</span>
              <span>{slotInfo.ahead}</span>
            </div>
          </div>
          <Link to="/mandi/queue" className="text-xs text-[#047857] font-extrabold flex items-center gap-1 hover:underline pt-1">
            <span>View Mandi Queue</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {/* Live Mandi Market Price Card (Connected to data.gov.in) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col justify-between space-y-4 sm:col-span-2 md:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Live Mandi Price</span>
              {marketSummary.isLive ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                  LIVE • data.gov.in
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                  ⚠ DUMMY DATA
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#0f172a] font-data-tabular">₹{marketSummary.modalPrice}</span>
              <span className="text-xs text-slate-500 font-bold">/ Qtl (Modal)</span>
            </div>
            <div className="mt-1 text-xs text-slate-800 font-bold">
              {marketSummary.crop} ({marketSummary.market})
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-[#15803d] font-extrabold">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              <span>Min: ₹{marketSummary.minPrice} • Max: ₹{marketSummary.maxPrice}</span>
            </div>
          </div>
          <Link to="/market" className="text-xs text-[#047857] font-extrabold flex items-center gap-1 hover:underline pt-1">
            <span>View All Mandi Prices</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* Booking Slot Modal Wizard */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 sm:space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#047857] text-2xl">calendar_month</span>
                <h2 className="text-base sm:text-lg font-black text-[#0f172a]">Book APMC Mandi Slot</h2>
              </div>
              <button onClick={() => setShowSlotModal(false)} className="p-1 text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleBookSlotSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Select APMC Mandi Centre *</label>
                <select 
                  value={slotForm.mandi}
                  onChange={(e) => setSlotForm({...slotForm, mandi: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                >
                  <option value="Pimpalgaon APMC Yard #2">Pimpalgaon APMC Yard #2 (Nashik)</option>
                  <option value="Lasalgaon APMC Yard #1">Lasalgaon APMC Yard #1 (Nashik)</option>
                  <option value="Yeola APMC Yard">Yeola APMC Yard (Nashik)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Select Produce Batch to Sell *</label>
                <select 
                  value={slotForm.lot}
                  onChange={(e) => setSlotForm({...slotForm, lot: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                >
                  {produceBatches.length > 0 ? (
                    produceBatches.map(b => (
                      <option key={b.id} value={`${b.lot_number || b.id} (${b.crop} ${b.quantity} ${b.unit || 'kg'})`}>
                        {b.lot_number || b.id} — {b.crop} (Grade {b.grade || 'C'} • {b.quantity} {b.unit || 'kg'})
                      </option>
                    ))
                  ) : (
                    <option value="No produce available">No produce registered in database</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">3. Select Date *</label>
                  <input 
                    type="date"
                    value={slotForm.date}
                    onChange={(e) => setSlotForm({...slotForm, date: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">4. Arrival Window *</label>
                  <select 
                    value={slotForm.timeWindow}
                    onChange={(e) => setSlotForm({...slotForm, timeWindow: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                  >
                    <option value="08:30 AM - 09:15 AM">08:30 AM - 09:15 AM</option>
                    <option value="10:00 AM - 10:45 AM">10:00 AM - 10:45 AM</option>
                    <option value="02:00 PM - 02:45 PM">02:00 PM - 02:45 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">5. Assigned Drayage Transport Vehicle</label>
                <select 
                  value={slotForm.driver}
                  onChange={(e) => setSlotForm({...slotForm, driver: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                >
                  <option value="Dattatray Shinde (MH-15-EG-4412)">Dattatray Shinde (MH-15-EG-4412)</option>
                  <option value="Sanjay More (MH-15-BJ-9182)">Sanjay More (MH-15-BJ-9182)</option>
                </select>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowSlotModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-[#047857] text-white font-extrabold rounded-xl hover:bg-[#065f46] shadow-md cursor-pointer"
                >
                  ✓ Confirm Slot & Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Gate Pass Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 sm:space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-[#0f172a]">Reschedule Gate Pass Entry</h2>
              <button onClick={() => setShowRescheduleModal(false)} className="p-1 text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select New Time Slot</label>
                <select 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                >
                  <option value="Tomorrow, 11:00 AM">Tomorrow, 11:00 AM</option>
                  <option value="Tomorrow, 02:30 PM">Tomorrow, 02:30 PM</option>
                  <option value="Day After, 08:30 AM">Day After, 08:30 AM</option>
                </select>
              </div>

              <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-[#047857] text-white font-extrabold rounded-xl hover:bg-[#065f46] cursor-pointer"
                >
                  Confirm New Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
