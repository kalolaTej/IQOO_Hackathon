import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function CreateLot() {
  const { session } = useAuth()
  const navigate = useNavigate()
  
  const [farms, setFarms] = useState([])
  const [loadingFarms, setLoadingFarms] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Form fields
  const [farmId, setFarmId] = useState('')
  const [cropType, setCropType] = useState('')
  const [quantityKg, setQuantityKg] = useState('')
  const [qualityNotes, setQualityNotes] = useState('')
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const headers = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        const res = await fetch(`${backendUrl}/api/farms`, { headers })
        if (res.ok) {
          const data = await res.json()
          const items = Array.isArray(data) ? data : data?.data || []
          setFarms(items)
          if (items.length === 1) {
            setFarmId(items[0].id)
          }
        }
      } catch (err) {
        setError('Failed to load farms')
      } finally {
        setLoadingFarms(false)
      }
    }
    fetchFarms()
  }, [session, backendUrl])

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files)
    setPhotos(files)
    
    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(newPreviews)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!farmId) return setError('Please select a farm')
    if (!cropType.trim()) return setError('Crop type is required')
    if (!quantityKg || Number(quantityKg) <= 0) return setError('Quantity must be greater than 0')
    if (photos.length === 0) return setError('At least one photo is required')

    setSubmitting(true)

    const formData = new FormData()
    formData.append('farm_id', farmId)
    formData.append('crop_type', cropType)
    formData.append('quantity_kg', quantityKg)
    formData.append('quality_notes', qualityNotes)
    photos.forEach(photo => formData.append('photos', photo))

    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const res = await fetch(`${backendUrl}/api/lots`, {
        method: 'POST',
        headers,
        body: formData
      })
      
      const data = await res.json()
      if (res.ok) {
        navigate(`/produce/${data.data?.id || data.id}`)
      } else {
        setError(data.error || 'Failed to create produce lot')
      }
    } catch (err) {
      setError('A network error occurred while creating the lot')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="pb-4 border-b border-[#E5E7EB]">
        <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">List Produce Lot</h1>
        <p className="text-sm text-[#666666] mt-1 font-medium">Add a new harvest lot for grading and procurement.</p>
      </div>

      {error && (
        <div className="bg-[#FEF3C7] text-[#D97706] p-4 rounded-xl flex items-start gap-3 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-base p-6 space-y-6">
        {/* Farm Selection */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#2F2F2F]">Farm</label>
          {loadingFarms ? (
            <div className="text-xs text-[#666666] flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading farms...
            </div>
          ) : farms.length === 0 ? (
            <div className="text-sm text-[#D97706] font-medium">No farms available. Please create a farm first.</div>
          ) : (
            <select
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#2F2F2F] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/50 transition-all font-medium"
            >
              <option value="">Select a farm...</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Crop Type & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#2F2F2F]">Crop Type</label>
            <input
              type="text"
              placeholder="e.g. Tomatoes"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#2F2F2F] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/50 transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#2F2F2F]">Quantity (kg)</label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
              min="0.1"
              step="0.1"
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#2F2F2F] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/50 transition-all font-medium"
            />
          </div>
        </div>

        {/* Quality Notes */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#2F2F2F]">Quality Notes (Optional)</label>
          <textarea
            placeholder="Add any details about the harvest..."
            value={qualityNotes}
            onChange={(e) => setQualityNotes(e.target.value)}
            rows={3}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#2F2F2F] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/50 transition-all font-medium resize-none"
          />
        </div>

        {/* Photos */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-[#2F2F2F]">Produce Photos</label>
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 flex flex-col items-center justify-center bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors relative">
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handlePhotoChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud size={32} className="text-[#8FAF5A] mb-3" />
            <p className="text-sm font-bold text-[#2F2F2F]">Click or drag photos to upload</p>
            <p className="text-xs text-[#666666] mt-1 font-medium">JPEG, PNG up to 10MB each</p>
          </div>
          
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {previews.map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-[#E5E7EB]">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#8FAF5A] hover:bg-[#7A994B] text-white font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {submitting ? (
            <><Loader2 size={18} className="animate-spin" /> Submitting...</>
          ) : (
            <><CheckCircle2 size={18} /> Create Lot</>
          )}
        </button>
      </form>
    </div>
  )
}
