import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertTriangle, ArrowLeft, Image as ImageIcon, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LotDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  
  const [lot, setLot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchLot = async () => {
      try {
        const headers = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        
        const res = await fetch(`${backendUrl}/api/lots/${id}`, { headers })
        const data = await res.json()
        
        if (res.ok) {
          setLot(data.data || data)
        } else {
          setError(data.error || 'Failed to fetch lot details')
        }
      } catch (err) {
        setError('A network error occurred while fetching the lot')
      } finally {
        setLoading(false)
      }
    }
    
    fetchLot()
  }, [id, session, backendUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="text-[#8FAF5A] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link to="/dashboard" className="text-sm font-bold text-[#666666] hover:text-[#2F2F2F] flex items-center gap-2 w-max">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="bg-[#FEF3C7] text-[#D97706] p-4 rounded-xl flex items-start gap-3 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  if (!lot) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center card-base">
        <AlertTriangle size={32} className="text-[#D97706] mx-auto mb-3" />
        <p className="text-sm font-bold text-[#2F2F2F]">Produce lot not found.</p>
      </div>
    )
  }

  const createdDate = new Date(lot.created_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 pb-4 border-b border-[#E5E7EB]">
        <Link to="/dashboard" className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#666666] hover:text-[#2F2F2F] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">{lot.crop_type}</h1>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-[#E5E7EB] text-[#2F2F2F]">
              {lot.status}
            </span>
          </div>
          <p className="text-sm text-[#666666] mt-1 font-medium">Recorded on {createdDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="card-base p-6 space-y-4">
            <h2 className="text-base font-extrabold text-[#2F2F2F]">Harvest Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#666666]">Quantity</p>
                <p className="text-xl font-extrabold text-[#2F2F2F] mt-1">{lot.quantity_kg} kg</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#666666]">Farm</p>
                <p className="text-sm font-bold text-[#2F2F2F] mt-1 truncate">
                  {lot.farms?.name || 'Unknown Farm'}
                </p>
              </div>
            </div>
            
            {lot.quality_notes && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-[#666666] mb-1">Quality Notes</p>
                <p className="text-sm font-medium text-[#2F2F2F]">{lot.quality_notes}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="card-base p-6 space-y-4">
            <h2 className="text-base font-extrabold text-[#2F2F2F] flex items-center gap-2">
              <ImageIcon size={18} className="text-[#8FAF5A]" />
              Produce Photos
            </h2>
            {lot.photo_urls && lot.photo_urls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {lot.photo_urls.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="aspect-square rounded-xl overflow-hidden border border-[#E5E7EB] block hover:opacity-90 transition-opacity">
                    <img src={url} alt={`Produce ${idx + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                <ImageIcon size={24} className="text-[#9CA3AF] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#666666]">No photos available.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Grading Card */}
          <div className="card-base p-6 space-y-4">
            <h2 className="text-base font-extrabold text-[#2F2F2F] flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#8FAF5A]" />
              Quality Grade
            </h2>
            
            {lot.grade ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
                  <span className="text-sm font-bold text-[#065F46]">Final Grade</span>
                  <span className="text-2xl font-black text-[#059669]">{lot.grade}</span>
                </div>
                
                {lot.defect_flags && lot.defect_flags.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-[#666666] mb-2">Defect Flags</p>
                    <div className="flex flex-wrap gap-2">
                      {lot.defect_flags.map((flag, idx) => (
                        <span key={idx} className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#059669]">
                    <CheckCircle2 size={16} /> Clean produce
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                <Loader2 size={24} className="text-[#8FAF5A] animate-spin mx-auto mb-2" />
                <p className="text-sm font-bold text-[#2F2F2F]">Grading pending</p>
                <p className="text-xs text-[#666666] mt-1 font-medium">OpenCV analysis is running...</p>
              </div>
            )}
          </div>
          
          <div className="card-base p-6 text-center">
            <Link to={`/transactions/${lot.id}`} className="text-sm font-bold text-[#8FAF5A] hover:text-[#7A994B] transition-colors underline underline-offset-2">
              View Procurement Status
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
