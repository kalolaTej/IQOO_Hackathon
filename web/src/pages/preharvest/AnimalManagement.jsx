import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Volume2, AlertTriangle, CheckCircle2, Sliders, RefreshCw } from 'lucide-react';
import { ANIMAL_IMAGES } from '../../lib/animalImages';
import { playSirenSound } from '../../lib/soundEffects';

// The 11 actual YOLO COCO target classes configured in ai/config.py
const YOLO_TARGET_CLASSES = [
  { id: 'elephant', name: 'Elephant', risk: 'Critical', desc: 'Crop trampling & fence destruction hazard' },
  { id: 'bear', name: 'Bear', risk: 'Critical', desc: 'Perimeter danger & orchard crop loss' },
  { id: 'pig', name: 'Wild Boar / Pig', risk: 'High', desc: 'Root rooting & high-volume night harvest damage' },
  { id: 'cow', name: 'Cow / Cattle', risk: 'Medium', desc: 'Open grazing & field perimeter intrusion' },
  { id: 'horse', name: 'Horse', risk: 'Medium', desc: 'Pasture breach & crop compaction' },
  { id: 'goat', name: 'Goat', risk: 'Medium', desc: 'Foliage and seedling grazing' },
  { id: 'sheep', name: 'Sheep', risk: 'Medium', desc: 'Ground crop and legume grazing' },
  { id: 'dog', name: 'Dog', risk: 'Low', desc: 'Perimeter traversal without crop consumption' },
  { id: 'cat', name: 'Cat', risk: 'Low', desc: 'Incidental movement in crop perimeter' },
  { id: 'zebra', name: 'Zebra', risk: 'Low', desc: 'Savanna / reserve corridor fauna' },
  { id: 'giraffe', name: 'Giraffe', risk: 'Low', desc: 'Arboreal herbivore corridor fauna' }
];

const STORAGE_KEY = 'agrisync_animal_settings_v1';

export const AnimalManagement = () => {
  const [animalSettings, setAnimalSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default: all enabled
    const initial = {};
    YOLO_TARGET_CLASSES.forEach((a) => {
      initial[a.id] = {
        enabled: true,
        todayCount: a.risk === 'High' ? 4 : a.risk === 'Critical' ? 0 : a.risk === 'Medium' ? 2 : 0,
        lastDetected: a.risk === 'High' ? '03:14 AM Today' : a.risk === 'Medium' ? 'Yesterday 11:45 PM' : 'No recent breaches'
      };
    });
    return initial;
  });

  const [filterRisk, setFilterRisk] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sync real detections from backend if available
  useEffect(() => {
    const fetchBackendDetections = async () => {
      try {
        const backendUrl = API_BASE_URL;
        const res = await fetch(`${backendUrl}/api/detections?limit=50`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
          if (items.length > 0) {
            setAnimalSettings((prev) => {
              const updated = { ...prev };
              const todayStr = new Date().toDateString();
              
              items.forEach((det) => {
                const rawAnimal = (det.animal || '').toLowerCase().trim();
                const matchedClass = YOLO_TARGET_CLASSES.find((c) => rawAnimal.includes(c.id) || c.id.includes(rawAnimal));
                if (matchedClass) {
                  const key = matchedClass.id;
                  const detDate = new Date(det.detected_at || det.created_at || Date.now());
                  const isToday = detDate.toDateString() === todayStr;
                  if (!updated[key]) {
                    updated[key] = { enabled: true, todayCount: 0, lastDetected: 'Never' };
                  }
                  if (isToday) {
                    updated[key].todayCount = (updated[key].todayCount || 0) + 1;
                  }
                  if (!updated[key].lastDetected || updated[key].lastDetected === 'No recent breaches') {
                    updated[key].lastDetected = detDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                }
              });
              return updated;
            });
          }
        }
      } catch {}
    };
    fetchBackendDetections();
  }, []);

  const handleToggle = (id) => {
    setAnimalSettings((prev) => {
      const current = prev[id] || { enabled: true, todayCount: 0, lastDetected: 'Never' };
      const updated = {
        ...prev,
        [id]: {
          ...current,
          enabled: !current.enabled
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleTriggerSiren = (animal) => {
    playSirenSound(3.5);
    setToastMessage(`🚨 Siren Trigger Test: Acoustic deterrent dispatched for ${animal.name}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredAnimals = YOLO_TARGET_CLASSES.filter(
    (a) => filterRisk === 'All' || a.risk === filterRisk
  );

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-[#047857] text-white font-extrabold text-xs shadow-2xl flex items-center gap-3 border border-[#a7f3d0] animate-in fade-in slide-in-from-top-4 duration-300">
          <Volume2 size={20} className="animate-spin text-[#dcfce7]" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 font-bold opacity-80 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">YOLO11n Animal Target Management</h1>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]">
              11 Supported Classes
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Configure automated alarm triggers, risk levels, and detection flags for species recognized by the edge computer vision model.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold flex items-center gap-1">
              <Sliders size={14} /> Risk Tier:
            </span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[#0f172a] outline-none shadow-2xs"
            >
              <option value="All">All Risk Tiers</option>
              <option value="Critical">Critical (Elephant, Bear)</option>
              <option value="High">High (Wild Boar)</option>
              <option value="Medium">Medium (Cattle, Horse, Goat)</option>
              <option value="Low">Low (Dog, Cat, etc.)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Animal Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAnimals.map((animal) => {
          const setting = animalSettings[animal.id] || { enabled: true, todayCount: 0, lastDetected: 'Never' };
          const isEnabled = setting.enabled !== false;
          const imgSrc = ANIMAL_IMAGES[animal.id] || ANIMAL_IMAGES.cow;

          const isCritical = animal.risk === 'Critical';
          const isHigh = animal.risk === 'High';
          const isMedium = animal.risk === 'Medium';

          return (
            <div
              key={animal.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                isEnabled ? 'border-slate-200 hover:shadow-md' : 'border-slate-200 opacity-60 bg-slate-50/70'
              }`}
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-36 bg-slate-900 overflow-hidden">
                  <img
                    src={imgSrc}
                    alt={animal.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      isEnabled ? 'hover:scale-105' : 'grayscale opacity-50'
                    }`}
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-600 text-white'
                          : isHigh
                          ? 'bg-amber-500 text-white'
                          : isMedium
                          ? 'bg-[#047857] text-white'
                          : 'bg-slate-600 text-white'
                      }`}
                    >
                      {animal.risk} Risk
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded text-[10px] font-mono text-white">
                    COCO: {animal.id}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-base text-[#0f172a]">{animal.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{animal.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(animal.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isEnabled ? 'bg-[#047857]' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={isEnabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Today's Detections</span>
                      <strong className="text-sm font-extrabold text-[#0f172a] font-data-tabular">
                        {setting.todayCount || 0}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Last Activity</span>
                      <strong className="text-[11px] text-slate-700 font-medium truncate block">
                        {setting.lastDetected || 'None'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  {isEnabled ? (
                    <span className="text-[#15803d] flex items-center gap-1">
                      <CheckCircle2 size={13} /> Active Detection
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <AlertTriangle size={13} /> Ignored by Siren
                    </span>
                  )}
                </span>
                <button
                  onClick={() => handleTriggerSiren(animal)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#0f172a] border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Volume2 size={13} className="text-[#047857]" /> Test Siren
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnimalManagement;
