import { API_BASE_URL, SOCKET_URL } from '../lib/api';
import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { Filter, Calendar, Camera, ChevronRight, RefreshCw, Search, ShieldCheck, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAnimalImage, ANIMAL_IMAGES } from '../lib/animalImages'

export default function Detections() {
  const { session } = useAuth()
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const [cameraFilter, setCameraFilter] = useState('All')
  const [animalFilter, setAnimalFilter] = useState('All')
  const [dateRangeFilter, setDateRangeFilter] = useState('All Time')
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState('')
  const limit = 15

  const fetchDetections = useCallback(async () => {
    const backendUrl = API_BASE_URL;
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
        ...(cameraFilter !== 'All' && { camera: cameraFilter }),
        ...(animalFilter !== 'All' && { animal: animalFilter })
      })

      const res = await fetch(`${backendUrl}/api/detections?${queryParams}`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.detections)
          ? data.detections
          : []

        setDetections((prev) => (page === 1 ? items : [...prev, ...items]))
        setHasMore(items.length >= limit)
      } else {
        if (page === 1) setDetections([])
        setHasMore(false)
      }
    } catch {
      if (page === 1) setDetections([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [session, page, cameraFilter, animalFilter])

  useEffect(() => {
    fetchDetections()

    const backendUrl = API_BASE_URL;
    const socket = io(SOCKET_URL || backendUrl || (typeof window !== 'undefined' ? window.location.origin : ''), { transports: ['websocket', 'polling'] })

    socket.on('new-detection', (newDet) => {
      if (newDet) {
        setDetections((prev) => [newDet, ...prev.filter((d) => d.id !== newDet.id)])
      }
    })

    socket.on('detections_cleared', () => {
      setDetections([])
      setHasMore(false)
    })

    socket.on('detection_deleted', ({ id }) => {
      if (id) {
        setDetections((prev) => prev.filter((d) => d.id !== id))
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [fetchDetections])

  const handleClearAll = async () => {
    setClearing(true)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`${API_BASE_URL}/api/detections`, {
        method: 'DELETE',
        headers,
      })
      if (res.ok) {
        setDetections([])
        setHasMore(false)
        setShowClearModal(false)
        setActionSuccessMessage('Detection history successfully cleared from database.')
        setTimeout(() => setActionSuccessMessage(''), 4000)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to clear detections: ${err.error || 'Server error'}`)
      }
    } catch (e) {
      alert(`Error clearing detections: ${e.message}`)
    } finally {
      setClearing(false)
    }
  }

  const handleDeleteOne = async (id, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Delete this detection log?')) return
    setDeletingId(id)
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`${API_BASE_URL}/api/detections/${id}`, {
        method: 'DELETE',
        headers,
      })
      if (res.ok) {
        setDetections((prev) => prev.filter((d) => d.id !== id))
      } else {
        alert('Failed to delete detection log.')
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const detectionList = Array.isArray(detections) ? detections : []

  const filteredItems = detectionList.filter((item) => {
    if (!item) return false
    if (cameraFilter !== 'All' && item.camera_id !== cameraFilter && item.camera_name !== cameraFilter) {
      return false
    }
    if (animalFilter !== 'All' && (item.animal || '').toLowerCase() !== animalFilter.toLowerCase()) {
      return false
    }
    if (dateRangeFilter === 'Today') {
      const today = new Date().toDateString()
      return new Date(item.created_at || item.detected_at || Date.now()).toDateString() === today
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchAnimal = (item.animal || '').toLowerCase().includes(query)
      const matchCam = (item.camera_name || '').toLowerCase().includes(query) || (item.camera_id || '').toLowerCase().includes(query)
      const matchZone = (item.zone || '').toLowerCase().includes(query)
      if (!matchAnimal && !matchCam && !matchZone) return false
    }
    return true
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* feedback message */}
      {actionSuccessMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Detection Logs & History</h1>
          <p className="text-xs text-[#666666] mt-1 font-medium">Search, filter, and audit past intrusion events captured across edge nodes.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => {
              setPage(1)
              fetchDetections()
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAFBF8] text-[#2F2F2F] text-xs font-bold transition-colors shadow-2xs min-h-[38px] cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            disabled={detectionList.length === 0}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors shadow-2xs min-h-[38px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-[#2F2F2F]">Clear All Detection History?</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                This will permanently delete all past intrusion records, snapshots, and animal alerts from your database.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-medium">
              💡 <strong>Note:</strong> Live edge cameras and sirens will continue monitoring actively.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {clearing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Clear All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* filters & search toolbar */}
      <div className="card-base p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* search input */}
        <div>
          <label className="text-xs font-bold text-[#666666] mb-1 flex items-center gap-1">
            <Search size={13} /> Keyword Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cow, wild boar..."
            className="w-full text-xs font-medium bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#2F2F2F] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A] min-h-[38px]"
          />
        </div>

        {/* camera filter */}
        <div>
          <label className="text-xs font-bold text-[#666666] mb-1 flex items-center gap-1">
            <Camera size={13} /> Camera Node
          </label>
          <select
            value={cameraFilter}
            onChange={(e) => {
              setCameraFilter(e.target.value)
              setPage(1)
            }}
            className="w-full text-xs font-medium bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#2F2F2F] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A] min-h-[38px]"
          >
            <option value="All">All Cameras</option>
            <option value="cam_01">North Field Cam (cam_01)</option>
            <option value="cam_02">South Perimeter (cam_02)</option>
            <option value="cam_03">East Barn Cam (cam_03)</option>
          </select>
        </div>

        {/* animal species filter */}
        <div>
          <label className="text-xs font-bold text-[#666666] mb-1 flex items-center gap-1">
            <Filter size={13} /> Species Type
          </label>
          <select
            value={animalFilter}
            onChange={(e) => {
              setAnimalFilter(e.target.value)
              setPage(1)
            }}
            className="w-full text-xs font-medium bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#2F2F2F] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A] min-h-[38px]"
          >
            <option value="All">All Species</option>
            <option value="cow">Cow / Cattle</option>
            <option value="wild_boar">Wild Boar</option>
            <option value="dog">Wild Dog</option>
            <option value="bear">Bear</option>
            <option value="pig">Pig</option>
            <option value="horse">Horse</option>
          </select>
        </div>

        {/* date range filter */}
        <div>
          <label className="text-xs font-bold text-[#666666] mb-1 flex items-center gap-1">
            <Calendar size={13} /> Time Window
          </label>
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="w-full text-xs font-medium bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#2F2F2F] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A] min-h-[38px]"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today Only</option>
          </select>
        </div>
      </div>

      {/* detection logs */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-stone-200/70 rounded-xl animate-shimmer"></div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 card-base space-y-2 p-6">
          <ShieldCheck size={36} className="mx-auto text-[#8A8A8A] opacity-60" />
          <p className="text-base font-bold text-[#2F2F2F]">No detection logs found in database.</p>
          <p className="text-xs text-[#666666] font-medium">Monitoring active perimeter streams for new intrusions.</p>
          {(cameraFilter !== 'All' || animalFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setCameraFilter('All')
                setAnimalFilter('All')
                setDateRangeFilter('All Time')
                setSearchQuery('')
              }}
              className="mt-3 text-xs text-[#6B8E23] hover:underline font-bold"
            >
              Reset search and filters
            </button>
          )}
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">Snapshot</th>
                  <th className="p-3.5">Species</th>
                  <th className="p-3.5">Camera Node & Farm</th>
                  <th className="p-3.5">Detection Zone</th>
                  <th className="p-3.5">Inference Source / Confidence</th>
                  <th className="p-3.5">Event Status</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredItems.map((item, idx) => {
                  const imgSrc = getAnimalImage(item?.animal, item?.image_url)
                  const isRealYolo = item?.source === 'real' || item?.source === 'yolo' || (item?.confidence && item?.source !== 'demo')
                  const isZebra = idx % 2 === 1

                  return (
                    <tr key={item?.id || idx} className={`hover:bg-slate-50 transition-colors ${isZebra ? 'bg-slate-50/50' : ''}`}>
                      <td className="p-3 pl-5">
                        <img
                          src={imgSrc}
                          alt={item?.animal || 'animal'}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-2xs"
                          onError={(e) => {
                            e.currentTarget.src = ANIMAL_IMAGES.cow
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <span className="font-extrabold text-[#0f172a] capitalize text-sm block">
                          {item?.animal?.replace(/_/g, ' ') || 'Animal'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {item?.id}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-[#0f172a] block text-xs">{item?.camera_name || item?.camera_id || 'North Perimeter Node #1'}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{item?.farm_name || 'Rajesh Farm (Niphad)'}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-[#047857] text-xs block">{item?.zone || 'North Field - Onion Plot'}</span>
                      </td>
                      <td className="p-3">
                        {isRealYolo ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] font-black text-[10px] border border-[#bbf7d0]">
                              REAL YOLO INFERENCE
                            </span>
                            <span className="block text-xs font-black text-[#0f172a] font-data-tabular">
                              {item?.confidence}% Confidence
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] border border-slate-200">
                              DEMO / SIMULATED
                            </span>
                            <span className="block text-[10px] text-slate-400 font-medium">
                              Simulated Event Log
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          item?.status === 'Resolved'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {item?.status || 'Active Alert'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium whitespace-nowrap text-xs">
                        {new Date(item?.created_at || item?.detected_at || Date.now()).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="p-3 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/detections/${item?.id || 'det_01'}`}
                            className="inline-flex items-center gap-1 text-[#047857] hover:underline font-bold text-xs min-h-[32px] px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"
                          >
                            <span>Inspect</span>
                            <ChevronRight size={14} />
                          </Link>
                          {item?.id && (
                            <button
                              onClick={(e) => handleDeleteOne(item.id, e)}
                              disabled={deletingId === item.id}
                              title="Delete log"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {deletingId === item.id ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredItems.map((item, idx) => {
              const imgSrc = getAnimalImage(item?.animal, item?.image_url)
              const isRealYolo = item?.source === 'real' || item?.source === 'yolo' || (item?.confidence && item?.source !== 'demo')

              return (
                <div key={item?.id || idx} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={imgSrc}
                      alt={item?.animal || 'animal'}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = ANIMAL_IMAGES.cow
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-extrabold text-[#0f172a] capitalize text-base truncate">
                          {item?.animal?.replace(/_/g, ' ') || 'Animal'}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                            item?.status === 'Resolved'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {item?.status || 'Active Alert'}
                          </span>
                          {item?.id && (
                            <button
                              onClick={(e) => handleDeleteOne(item.id, e)}
                              disabled={deletingId === item.id}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold truncate mt-0.5">
                        {item?.camera_name || item?.camera_id || 'North Perimeter Cam'}
                      </p>
                      <p className="text-[11px] text-[#047857] font-medium truncate">
                        {item?.zone || 'Perimeter Zone'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      {isRealYolo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#dcfce7] text-[#15803d] font-bold text-[10px]">
                          YOLO • {item?.confidence}% Confidence
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          Simulated Event
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(item?.created_at || item?.detected_at || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      to={`/detections/${item?.id || 'det_01'}`}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 min-h-[38px]"
                    >
                      <span>Inspect Detection Snapshot</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {hasMore && (
            <div className="p-4 border-t border-[#E5E7EB] text-center bg-[#FAFBF8]">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#2F2F2F] hover:bg-[#FAFBF8] transition-colors shadow-2xs min-h-[40px]"
              >
                Load More Detection Records
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
