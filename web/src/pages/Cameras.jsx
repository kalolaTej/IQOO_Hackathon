import { API_BASE_URL, SOCKET_URL } from '../lib/api';
import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  Video,
  Radio,
  Trash2,
  Edit,
  ShieldCheck,
  Activity,
  Sliders,
  Play,
  Square,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getImageUrl, resolveCameraStreamUrl } from '../lib/imageUtils'
import AddCameraModal from '../components/AddCameraModal'

export default function Cameras() {
  const { session } = useAuth()
  const [cameras, setCameras] = useState([])
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedZone, setSelectedZone] = useState('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [cameraToEdit, setCameraToEdit] = useState(null)
  const [cameraToDelete, setCameraToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)

  const backendUrl = API_BASE_URL;

  const showNotification = (msg, type = 'success') => {
    setActionMessage({ text: msg, type })
    setTimeout(() => setActionMessage(null), 4000)
  }

  const fetchFarms = useCallback(async () => {
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`${backendUrl}/api/farms`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        setFarms(items)
      }
    } catch {}
  }, [backendUrl, session])

  const fetchCameras = useCallback(async () => {
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`${backendUrl}/api/cameras`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.cameras)
          ? data.cameras
          : []

        setCameras(items)
      }
    } catch (err) {
      console.error('Failed to fetch cameras:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [backendUrl, session])

  useEffect(() => {
    fetchCameras()
    fetchFarms()
  }, [fetchCameras, fetchFarms])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchCameras()
  }

  const handleCameraAdded = (newCam) => {
    setCameras((prev) => [newCam, ...prev.filter((c) => c.id !== newCam.id)])
    showNotification(`Camera "${newCam.name}" added successfully.`)
    fetchCameras()
  }

  const handleCameraUpdated = (updatedCam) => {
    setCameras((prev) => prev.map((c) => (c.id === updatedCam.id ? updatedCam : c)))
    showNotification(`Camera "${updatedCam.name}" updated successfully.`)
    setCameraToEdit(null)
    fetchCameras()
  }

  const handleDeleteCamera = async () => {
    if (!cameraToDelete) return
    setDeleting(true)

    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch(`${backendUrl}/api/cameras/${cameraToDelete.id}`, {
        method: 'DELETE',
        headers,
      })

      if (res.ok) {
        setCameras((prev) => prev.filter((c) => c.id !== cameraToDelete.id))
        showNotification(`Camera "${cameraToDelete.name}" deleted and monitoring stopped.`)
        setCameraToDelete(null)
      } else {
        showNotification('Failed to delete camera', 'error')
      }
    } catch (err) {
      showNotification('Network error while deleting camera', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const toggleMonitoring = async (camId, currentStatus) => {
    const newStatus = !currentStatus

    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === camId) {
          return {
            ...c,
            monitoring_enabled: newStatus,
            status: newStatus ? 'online' : 'disabled',
            last_ping: newStatus ? 'Live now' : 'Monitoring Disabled',
          }
        }
        return c
      })
    )

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      await fetch(`${backendUrl}/api/cameras/${camId}/monitoring`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ enabled: newStatus }),
      })
      showNotification(`Monitoring ${newStatus ? 'enabled' : 'disabled'}`)
    } catch {
      fetchCameras()
    }
  }

  const toggleCameraOnlineStatus = async (camId, currentStatus) => {
    const isOnline = currentStatus === 'online' || currentStatus === true
    const nextStatus = !isOnline

    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === camId) {
          return {
            ...c,
            status: nextStatus ? 'online' : 'offline',
            fps: nextStatus ? 30 : 0,
            last_ping: nextStatus ? 'Live now' : 'Offline (Disconnected)',
          }
        }
        return c
      })
    )

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      await fetch(`${backendUrl}/api/cameras/${camId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: nextStatus }),
      })
    } catch {
      fetchCameras()
    }
  }

  const zones = ['All', ...new Set(cameras.map((c) => c?.zone).filter(Boolean))]
  const filteredCameras =
    selectedZone === 'All' ? cameras : cameras.filter((c) => c?.zone === selectedZone)

  const activeCount = cameras.filter((c) => c.status === 'online' || c.status === true).length

  return (
    <div className="space-y-6">
      {/* Toast notification banner */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between animate-fade-in ${
            actionMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">Perimeter Camera Management & IoT Nodes</h1>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]">
              {activeCount} / {cameras.length} Active Nodes
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Live edge IP cameras, RTSP streams, multi-camera health monitoring, and YOLO11n intrusion detection pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setCameraToEdit(null)
              setIsAddModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white text-xs font-extrabold transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>+ Add IP Camera</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0f172a] text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#047857]' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Zone Filter Pills */}
      {zones.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs text-slate-500 font-bold flex items-center gap-1 mr-1 shrink-0">
            <Filter size={14} /> Filter Zone:
          </span>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1 text-xs rounded-full font-bold transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                selectedZone === zone
                  ? 'bg-[#047857] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin text-[#047857]" />
          <span className="ml-3 text-xs font-bold text-slate-600">Loading camera nodes from database...</span>
        </div>
      ) : filteredCameras.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Video size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">No Cameras Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add your first IP camera with RTSP or HTTP stream URL to begin automatic intrusion monitoring.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] text-white text-xs font-bold shadow-md cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Camera Now</span>
          </button>
        </div>
      ) : (
        /* Camera Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCameras.map((cam, idx) => {
            const isOnline = cam?.status === 'online' || cam?.status === true
            const isMonitoringOn = cam?.monitoring_enabled !== false

            return (
              <div
                key={cam?.id || idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Stream Preview Header */}
                  <div className="relative h-48 bg-slate-950 flex items-center justify-center overflow-hidden">
                    <img
                      src={resolveCameraStreamUrl(cam)}
                      alt={cam?.name || 'Camera Stream'}
                      className={`w-full h-full object-cover transition-opacity ${
                        isOnline ? 'opacity-90 hover:opacity-100' : 'opacity-30 grayscale'
                      }`}
                      onError={(e) => {
                        e.currentTarget.src = ANIMAL_IMAGES.cow
                      }}
                    />

                    {/* Overlay Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="bg-black/70 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded flex items-center gap-1 border border-white/20">
                        <Video size={12} className={isOnline ? 'text-[#34d399]' : 'text-slate-400'} />
                        {cam?.camera_type || 'RTSP'} • {cam?.resolution || '1080p'} • {cam?.fps || 0} FPS
                      </span>
                      {cam?.purpose && (
                        <span className="bg-[#047857]/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                          {cam.purpose}
                        </span>
                      )}
                    </div>

                    {/* Online/Offline Toggle Button */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        onClick={() => toggleCameraOnlineStatus(cam.id, cam.status)}
                        title="Toggle Camera Node Online/Offline"
                        className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full transition-transform active:scale-95 cursor-pointer shadow-md ${
                          isOnline
                            ? 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#15803d] animate-pulse' : 'bg-slate-400'}`}></span>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </button>
                    </div>

                    {/* Stream URL footer overlay */}
                    {cam?.source_url && (
                      <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 truncate flex items-center gap-1.5">
                        <Radio size={11} className={isOnline ? 'text-[#34d399]' : 'text-slate-500'} />
                        <span className="truncate">{cam.source_url}</span>
                      </div>
                    )}
                  </div>

                  {/* Camera Information Details */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-black text-base text-[#0f172a]">{cam?.name || 'Perimeter Camera Node'}</h3>
                        <p className="text-xs text-[#047857] font-bold mt-0.5">
                          Zone: {cam?.zone || 'North Field - Onion Plot'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          IP: <span className="font-mono">{cam?.ip || '192.168.1.105'}:{cam?.port || 554}</span> • Node ID: <span className="font-mono">{cam?.id}</span>
                        </p>
                      </div>

                      {/* Monitoring Toggle */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">AI Monitoring</span>
                        <button
                          onClick={() => toggleMonitoring(cam.id, isMonitoringOn)}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isMonitoringOn
                              ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isMonitoringOn ? '✓ ACTIVE' : '✕ DISABLED'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Telemetry Heartbeat</span>
                        <span className="font-bold text-[#0f172a] text-[11px] flex items-center gap-1 mt-0.5">
                          <Activity size={12} className={isOnline ? 'text-[#047857]' : 'text-slate-400'} />
                          {cam?.last_ping || 'Active'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Field</span>
                        <span className="font-semibold text-slate-700 text-[11px] truncate block mt-0.5">
                          {cam?.zone || 'North Field - Onion Plot'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer: Edit, Delete, Status */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-bold">
                    {isOnline ? (
                      <CheckCircle2 size={14} className="text-[#15803d]" />
                    ) : (
                      <AlertCircle size={14} className="text-red-500" />
                    )}
                    {isOnline ? 'Stream Synchronized' : 'Offline (Click Online to Connect)'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCameraToEdit(cam)
                        setIsAddModalOpen(true)
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Edit Camera"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setCameraToDelete(cam)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                      title="Delete Camera"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Camera Modal */}
      <AddCameraModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setCameraToEdit(null)
        }}
        onCameraAdded={handleCameraAdded}
        onCameraUpdated={handleCameraUpdated}
        cameraToEdit={cameraToEdit}
        farms={farms}
      />

      {/* Delete Confirmation Modal */}
      {cameraToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0f172a] text-base">Delete Camera Node</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-700">{cameraToDelete.name}</strong>? Monitoring will be stopped. Historical detections will remain saved for audits.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCameraToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCamera}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {deleting && <RefreshCw size={12} className="animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
