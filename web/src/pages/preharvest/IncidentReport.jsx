import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, CheckCircle2, FileText, Plus, RefreshCw, Calendar, MapPin, Tag, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const CROP_OPTIONS = ['Wheat', 'Rice', 'Corn', 'Sugarcane', 'Vegetables', 'Cotton', 'Fruits', 'Pulse / Legumes', 'Other']

export default function IncidentReport() {
  const { session } = useAuth()
  const [farms, setFarms] = useState([])
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [recentDetections, setRecentDetections] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  // Form states
  const [detectionId, setDetectionId] = useState('')
  const [cropType, setCropType] = useState('Wheat')
  const [customCrop, setCustomCrop] = useState('')
  const [affectedArea, setAffectedArea] = useState('')
  const [notes, setNotes] = useState('')

  const backendUrl = API_BASE_URL;

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
        if (items.length > 0 && !selectedFarmId) {
          setSelectedFarmId(items[0].id)
        }
      }
    } catch {
      // ignore
    }
  }, [backendUrl, session, selectedFarmId])

  const fetchDetections = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/detections?limit=15`)
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        setRecentDetections(items)
      }
    } catch {
      // ignore
    }
  }, [backendUrl])

  const fetchIncidents = useCallback(async () => {
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const queryStr = selectedFarmId ? `?farm_id=${selectedFarmId}` : ''
      const res = await fetch(`${backendUrl}/api/incidents${queryStr}`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        setIncidents(items)
      }
    } catch {
      // keep existing state
    } finally {
      setLoading(false)
    }
  }, [backendUrl, session, selectedFarmId])

  useEffect(() => {
    fetchFarms()
    fetchDetections()
  }, [fetchFarms, fetchDetections])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeedback(null)

    const finalCrop = cropType === 'Other' ? customCrop : cropType
    if (!finalCrop.trim()) {
      setFeedback({ type: 'error', message: 'Please select or specify a valid crop type.' })
      return
    }

    if (!affectedArea.trim()) {
      setFeedback({ type: 'error', message: 'Please enter estimated affected area (e.g. 0.5 acres or 15%).' })
      return
    }

    setSubmitting(true)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const payload = {
        farm_id: selectedFarmId || '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
        detection_id: detectionId || null,
        crop_type: finalCrop.trim(),
        affected_area_estimate: affectedArea.trim(),
        notes: notes.trim() || undefined,
      }

      const res = await fetch(`${backendUrl}/api/incidents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()

      if (res.status === 201 || res.ok) {
        setFeedback({ type: 'success', message: 'Crop-loss incident logged successfully.' })
        setAffectedArea('')
        setNotes('')
        setDetectionId('')
        fetchIncidents()
      } else {
        setFeedback({ type: 'error', message: responseData.error || 'Failed to log incident.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `Network error: ${err.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Crop-Loss Incident Reporting</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#8FAF5A]/15 text-[#8FAF5A] border border-[#8FAF5A]/30">
              Pre-Harvest
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-1 font-medium">
            Log crop damage linked to intrusion events or manual observations to maintain yield estimates.
          </p>
        </div>

        <button
          onClick={() => fetchIncidents()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FAFBF8] text-[#2F2F2F] text-xs font-bold transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#8FAF5A]' : ''} />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* Main Grid: Left Form, Right Recent Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-base p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
              <FileText size={18} className="text-[#8FAF5A]" />
              <h2 className="text-base font-extrabold text-[#2F2F2F]">Report Crop Loss</h2>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                    : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Farm Selection */}
              <div>
                <label className="block text-xs font-bold text-[#2F2F2F] mb-1">Target Farm</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-[#2F2F2F] focus:outline-none focus:border-[#8FAF5A]"
                >
                  {farms.length === 0 ? (
                    <option value="">Default Farm Node</option>
                  ) : (
                    farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.location || 'Main Field'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Detection Linking */}
              <div>
                <label className="block text-xs font-bold text-[#2F2F2F] mb-1">
                  Link to Intrusion Event <span className="text-[#8A8A8A] font-normal">(Optional)</span>
                </label>
                <select
                  value={detectionId}
                  onChange={(e) => setDetectionId(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-[#2F2F2F] focus:outline-none focus:border-[#8FAF5A]"
                >
                  <option value="">Manual Log (Not linked to detection)</option>
                  {recentDetections.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.animal?.toUpperCase()} - {d.confidence}% ({new Date(d.detected_at || Date.now()).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Type Selection */}
              <div>
                <label className="block text-xs font-bold text-[#2F2F2F] mb-1">Crop Type</label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-[#2F2F2F] focus:outline-none focus:border-[#8FAF5A]"
                >
                  {CROP_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {cropType === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom crop name..."
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    className="mt-2 w-full text-xs font-semibold bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-[#2F2F2F] focus:outline-none focus:border-[#8FAF5A]"
                  />
                )}
              </div>

              {/* Affected Area Estimate */}
              <div>
                <label className="block text-xs font-bold text-[#2F2F2F] mb-1">Affected Area Estimate</label>
                <input
                  type="text"
                  placeholder="e.g. 0.5 acres, 20%, or 300 sq. meters"
                  value={affectedArea}
                  onChange={(e) => setAffectedArea(e.target.value)}
                  required
                  className="w-full text-xs font-semibold bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-[#2F2F2F] focus:outline-none focus:border-[#8FAF5A]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#2F2F2F] mb-1">
                  Incident Notes <span className="text-[#8A8A8A] font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe crop damage details, location within perimeter, or animal observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-[#2F2F2F] focus:outline-none focus:border-[#8FAF5A] resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8FAF5A] hover:bg-[#7A9949] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Submit Incident Report</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Log List Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-base p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-[#8FAF5A]" />
                <h2 className="text-base font-extrabold text-[#2F2F2F]">Logged Incidents History</h2>
              </div>
              <span className="text-xs font-bold text-[#666666] bg-stone-100 px-2.5 py-1 rounded-lg">
                {incidents.length} Recorded
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-stone-200/70 rounded-xl animate-shimmer"></div>
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <ShieldAlert size={36} className="mx-auto text-[#8A8A8A] opacity-60" />
                <p className="text-sm font-bold text-[#2F2F2F]">No crop loss incidents logged yet.</p>
                <p className="text-xs text-[#666666]">Use the form on the left to submit your first incident record.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FAFBF8] transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#2F2F2F] bg-stone-100 px-2 py-0.5 rounded">
                          {item.crop_type}
                        </span>
                        <span className="text-xs font-bold text-[#8FAF5A] bg-[#8FAF5A]/10 px-2 py-0.5 rounded border border-[#8FAF5A]/20">
                          Est: {item.affected_area_estimate}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(item.reported_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {item.notes && <p className="text-xs text-[#666666] font-medium italic">{item.notes}</p>}

                    <div className="flex items-center justify-between text-[11px] text-[#8A8A8A] pt-1 border-t border-[#E5E7EB]/60">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> Farm ID: {String(item.farm_id).substring(0, 8)}...
                      </span>
                      <span className="text-[#059669] font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Farmer Confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
