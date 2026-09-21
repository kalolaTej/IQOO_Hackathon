import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, TrendingUp, Filter, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function MandiPrices() {
  const { session } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [unavailableMessage, setUnavailableMessage] = useState('')

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const headers = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        
        const res = await fetch(`${backendUrl}/api/mandi/prices`, { headers })
        const json = await res.json()
        
        if (res.ok) {
          if (json.available === false) {
            setUnavailable(true)
            setUnavailableMessage(json.message || "Live mandi price data is not configured.")
          } else {
            setData(json.data || json)
          }
        } else {
          setError(json.error || 'Failed to fetch mandi prices.')
        }
      } catch (err) {
        setError('A network error occurred while fetching mandi prices.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPrices()
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
      <div className="pb-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Mandi Price Intelligence</h1>
          <p className="text-sm text-[#666666] mt-1 font-medium">Real-time market insights from agricultural exchanges.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
          <TrendingUp size={16} className="text-[#8FAF5A]" />
          <span className="text-xs font-bold text-[#666666]">Market Analysis</span>
        </div>
      </div>

      {error && (
        <div className="bg-[#FEE2E2] text-[#DC2626] p-4 rounded-xl flex items-start gap-3 border border-[#FCA5A5]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {unavailable && !error ? (
        <div className="card-base p-8 text-center space-y-4 bg-[#F9FAFB]">
          <AlertTriangle size={48} className="text-[#D97706] mx-auto opacity-80" />
          <div>
            <h2 className="text-lg font-extrabold text-[#2F2F2F]">Live Data Unavailable</h2>
            <p className="text-sm font-medium text-[#666666] mt-2 max-w-md mx-auto">
              {unavailableMessage}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEF3C7] text-[#D97706] rounded-full text-xs font-bold border border-[#FDE68A]">
            <CheckCircle2 size={14} /> Graceful Degradation Active
          </div>
        </div>
      ) : data ? (
        <div className="card-base p-6">
           {/* Rendering structure for future live data */}
           <div className="flex items-center gap-2 mb-4">
             <Filter size={16} className="text-[#8A8A8A]" />
             <span className="text-sm font-bold text-[#2F2F2F]">Market Data</span>
           </div>
           <pre className="text-xs text-[#666666] bg-[#F3F4F6] p-4 rounded-xl overflow-x-auto">
             {JSON.stringify(data, null, 2)}
           </pre>
        </div>
      ) : null}
    </div>
  )
}
