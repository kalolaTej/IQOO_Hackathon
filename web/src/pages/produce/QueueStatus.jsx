import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertTriangle, ArrowLeft, Clock, Activity, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { io } from 'socket.io-client'

export default function QueueStatus() {
  const { centreId } = useParams()
  const { session } = useAuth()
  
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const backendUrl = API_BASE_URL;

  const fetchQueue = async () => {
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const res = await fetch(`${backendUrl}/api/queue/${centreId}`, { headers })
      const data = await res.json()
      
      if (res.ok) {
        setQueue(data.data || data)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch queue status')
      }
    } catch (err) {
      setError('A network error occurred while fetching the queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
    
    // Socket.io Realtime Integration
    const socket = io(SOCKET_URL || backendUrl || (typeof window !== 'undefined' ? window.location.origin : ''))
    
    socket.on('connect', () => {
      console.log('Connected to realtime queue updates')
    })

    socket.on('queue-updated', (payload) => {
      if (payload && payload.centre_id === centreId) {
        // Refresh the queue when an event for this centre is received
        fetchQueue()
      }
    })

    return () => {
      socket.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centreId, session, backendUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="text-[#8FAF5A] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 pb-4 border-b border-[#E5E7EB]">
        <Link to="/procurement" className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#666666] hover:text-[#2F2F2F] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Live Procurement Queue</h1>
          <p className="text-sm text-[#666666] mt-1 font-medium">Real-time FIFO status for unloading.</p>
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF3C7] text-[#D97706] p-4 rounded-xl flex items-start gap-3 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!error && queue.length === 0 ? (
        <div className="p-12 text-center card-base">
          <Activity size={32} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#2F2F2F]">Queue is currently empty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item, idx) => {
            const isTop = idx === 0 && item.status === 'in_progress'
            const d = new Date(item.procurement_slots?.slot_time || new Date())
            
            let statusColor = 'bg-[#F3F4F6] text-[#666666]'
            let StatusIcon = Clock
            if (item.status === 'in_progress') {
              statusColor = 'bg-[#FEF3C7] text-[#D97706]'
              StatusIcon = Activity
            } else if (item.status === 'completed') {
              statusColor = 'bg-[#ECFDF5] text-[#059669]'
              StatusIcon = CheckCircle2
            } else if (item.status === 'cancelled') {
              statusColor = 'bg-[#FEE2E2] text-[#DC2626]'
              StatusIcon = XCircle
            }

            return (
              <div 
                key={item.id} 
                className={`card-base p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isTop ? 'ring-2 ring-[#8FAF5A] shadow-md' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isTop ? 'bg-[#8FAF5A] text-white' : 'bg-[#F9FAFB] border border-[#E5E7EB] text-[#2F2F2F]'}`}>
                    <span className="text-[10px] font-bold uppercase opacity-70">Pos</span>
                    <span className="text-lg font-black leading-none">{item.queue_position}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#2F2F2F]">
                      {item.produce_lots?.crop_type || 'Produce Lot'} <span className="font-medium text-[#666666]">({item.produce_lots?.quantity_kg || 0} kg)</span>
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-[#666666]">
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-[#8A8A8A]" />
                        {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 border-t border-[#E5E7EB] sm:pt-0 sm:border-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${statusColor}`}>
                    <StatusIcon size={14} />
                    {item.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
