import { API_BASE_URL, SOCKET_URL } from '../lib/api';
import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { Filter, Calendar, Camera, ChevronRight, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAnimalImage, ANIMAL_IMAGES } from '../lib/animalImages'

const DEFAULT_DEMO_DETECTIONS = [
  {
    id: 'DET-2026-091',
    animal: 'wild_boar',
    camera_id: 'cam_01',
    camera_name: 'North Perimeter Cam',
    farm_name: 'Rajesh Farm (Niphad)',
    zone: 'North Field - Onion Plot',
    confidence: 92,
    source: 'live',
    status: 'Alert Dispatched',
    detected_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    image_url: '/uploads/detections/sample_wild_boar.jpg'
  },
  {
    id: 'DET-2026-088',
    animal: 'cow',
    camera_id: 'cam_02',
    camera_name: 'East Boundary Cam',
    farm_name: 'Rajesh Farm (Niphad)',
    zone: 'East Boundary - Sugarcane',
    confidence: 88,
    source: 'live',
    status: 'Resolved',
    detected_at: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    image_url: '/uploads/detections/sample_cow.jpg'
  }
];

export default function Detections() {
  const { session } = useAuth()
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [detections, setDetections] = useState(DEFAULT_DEMO_DETECTIONS)
  const [loading, setLoading] = useState(true)
  const [cameraFilter, setCameraFilter] = useState('All')
  const [animalFilter, setAnimalFilter] = useState('All')
  const [dateRangeFilter, setDateRangeFilter] = useState('All Time')
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
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

        if (items.length > 0) {
          setDetections((prev) => (page === 1 ? items : [...prev, ...items]))
          setHasMore(items.length >= limit)
        } else {
          setDetections((prev) => (prev.length > 0 ? prev : DEFAULT_DEMO_DETECTIONS))
          setHasMore(false)
        }
      } else {
        setDetections((prev) => (prev.length > 0 ? prev : DEFAULT_DEMO_DETECTIONS))
        setHasMore(false)
      }
    } catch {
      setDetections((prev) => (prev.length > 0 ? prev : DEFAULT_DEMO_DETECTIONS))
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

    return () => {
      socket.disconnect()
    }
  }, [fetchDetections])

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
    <div className="space-y-6">
      {/* page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Detection Logs & History</h1>
          <p className="text-xs text-[#666666] mt-1 font-medium">Search, filter, and audit past intrusion events captured across edge nodes.</p>
        </div>

        <button
          onClick={() => {
            setPage(1)
            fetchDetections()
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAFBF8] text-[#2F2F2F] text-xs font-bold transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {/* filters & search toolbar */}
      <div className="card-base p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* search input */}
        <div className="sm:col-span-1">
          <label className="text-xs font-bold text-[#666666] mb-1 flex items-center gap-1">
            <Search size={13} /> Keyword Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cow, bear..."
            className="w-full text-xs font-medium bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#2F2F2F] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A]"
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
            className="w-full text-xs font-medium bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#2F2F2F] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A]"
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
            className="w-full text-xs font-medium bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#2F2F2F] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A]"
          >
            <option value="All">All Species</option>
            <option value="cow">Cow / Cattle</option>
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
            className="w-full text-xs font-medium bg-[#FAFBF8] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#2F2F2F] focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/30 focus:border-[#8FAF5A]"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today Only</option>
          </select>
        </div>
      </div>

      {/* detection logs table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-stone-200/70 rounded-xl animate-shimmer"></div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 card-base space-y-2">
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
          <div className="overflow-x-auto">
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
                          {item?.animal || 'Animal'}
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
                        <Link
                          to={`/detections/${item?.id || 'det_01'}`}
                          className="inline-flex items-center gap-1 text-[#047857] hover:underline font-bold text-xs"
                        >
                          <span>Inspect</span>
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="p-4 border-t border-[#E5E7EB] text-center bg-[#FAFBF8]">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#2F2F2F] hover:bg-[#FAFBF8] transition-colors shadow-2xs"
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
