import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Loader2, AlertTriangle, Building, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function ProcurementCentres() {
  const { session } = useAuth()
  
  const [centres, setCentres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const headers = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        
        const res = await fetch(`${backendUrl}/api/centres`, { headers })
        const data = await res.json()
        
        if (res.ok) {
          setCentres(data.data || data)
        } else {
          setError(data.error || 'Failed to fetch procurement centres')
        }
      } catch (err) {
        setError('A network error occurred while fetching centres')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCentres()
  }, [session, backendUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="text-[#8FAF5A] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="pb-4 border-b border-[#E5E7EB]">
        <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Procurement Centres</h1>
        <p className="text-sm text-[#666666] mt-1 font-medium">Discover active centres and book unloading slots.</p>
      </div>

      {error && (
        <div className="bg-[#FEF3C7] text-[#D97706] p-4 rounded-xl flex items-start gap-3 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!error && centres.length === 0 ? (
        <div className="p-12 text-center card-base">
          <Building size={32} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#2F2F2F]">No procurement centres available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {centres.map(centre => (
            <div key={centre.id} className="card-base card-interactive p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-extrabold text-[#2F2F2F] tracking-tight">{centre.name}</h2>
                  <div className="w-10 h-10 rounded-xl bg-[#8FAF5A]/15 text-[#526F1B] flex items-center justify-center shrink-0">
                    <Building size={18} />
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-sm font-medium text-[#666666]">
                  <MapPin size={16} className="text-[#8A8A8A]" />
                  {centre.location}
                </div>
                
                <div className="pt-3 border-t border-[#E5E7EB]">
                  <p className="text-xs font-semibold text-[#666666]">Daily Capacity</p>
                  <p className="text-xl font-extrabold text-[#2F2F2F] mt-0.5">{centre.daily_capacity_kg} kg</p>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                <Link to={`/procurement/${centre.id}/queue`} className="text-sm font-bold text-[#666666] hover:text-[#2F2F2F] transition-colors underline underline-offset-2">
                  View Queue
                </Link>
                <Link 
                  to={`/procurement/${centre.id}/slots`} 
                  className="bg-[#2F2F2F] hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  View Slots <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
