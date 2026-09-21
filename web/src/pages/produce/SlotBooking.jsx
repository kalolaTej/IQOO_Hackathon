import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, AlertTriangle, Calendar, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function SlotBooking() {
  const { centreId } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  
  const [slots, setSlots] = useState([])
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [selectedLotId, setSelectedLotId] = useState('')
  const [bookingSlotId, setBookingSlotId] = useState(null)
  
  const backendUrl = API_BASE_URL;

  const fetchData = async () => {
    try {
      setLoading(true)
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const [slotsRes, lotsRes] = await Promise.all([
        fetch(`${backendUrl}/api/centres/${centreId}/slots`, { headers }),
        fetch(`${backendUrl}/api/lots`, { headers })
      ])
      
      const slotsData = await slotsRes.json()
      const lotsData = await lotsRes.json()
      
      if (slotsRes.ok && lotsRes.ok) {
        setSlots(slotsData.data || slotsData)
        
        const fetchedLots = Array.isArray(lotsData) ? lotsData : (lotsData.data || [])
        // Only allow booking unbooked lots
        const availableLots = fetchedLots.filter(l => l.status === 'listed' || l.status === 'graded')
        setLots(availableLots)
        if (availableLots.length > 0) {
          setSelectedLotId(availableLots[0].id)
        }
      } else {
        setError(slotsData.error || lotsData.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError('A network error occurred while fetching booking data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centreId, session, backendUrl])

  const handleBook = async (slotId) => {
    if (!selectedLotId) return setError('Please select a lot to book.')
    
    setBookingSlotId(slotId)
    setError('')
    
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const res = await fetch(`${backendUrl}/api/slots/${slotId}/book`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ lot_id: selectedLotId })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        navigate(`/procurement/${centreId}/queue`)
      } else {
        setError(data.error || 'Failed to book slot')
      }
    } catch (err) {
      setError('A network error occurred while booking the slot')
    } finally {
      setBookingSlotId(null)
    }
  }

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
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Available Slots</h1>
          <p className="text-sm text-[#666666] mt-1 font-medium">Book a time to unload your produce.</p>
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF3C7] text-[#D97706] p-4 rounded-xl flex items-start gap-3 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Lot Selection Area */}
      <div className="card-base p-6">
        <h2 className="text-sm font-bold text-[#2F2F2F] mb-3">Select Produce Lot to Book</h2>
        {lots.length === 0 ? (
          <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-sm text-[#D97706] font-medium flex items-center gap-2">
            <AlertTriangle size={16} /> No eligible lots available. Create one first.
          </div>
        ) : (
          <select
            value={selectedLotId}
            onChange={(e) => setSelectedLotId(e.target.value)}
            className="w-full max-w-md bg-[#F9FAFB] border border-[#E5E7EB] text-[#2F2F2F] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/50 transition-all font-medium"
          >
            {lots.map(l => (
              <option key={l.id} value={l.id}>{l.crop_type} ({l.quantity_kg} kg) - {l.grade || 'Pending'}</option>
            ))}
          </select>
        )}
      </div>

      {/* Slots List */}
      {!error && slots.length === 0 ? (
        <div className="p-12 text-center card-base">
          <Calendar size={32} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#2F2F2F]">No slots available for this centre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {slots.map(slot => {
            const isFull = slot.current_bookings >= slot.max_bookings
            const remaining = Math.max(0, slot.max_bookings - slot.current_bookings)
            const d = new Date(slot.slot_time)
            
            return (
              <div key={slot.id} className="card-base p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#8FAF5A]">
                    <Clock size={18} />
                    <span className="font-extrabold text-[#2F2F2F]">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-sm font-medium text-[#666666]">
                    {d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                  
                  <div className="pt-3 border-t border-[#E5E7EB]">
                    <p className="text-xs font-semibold text-[#666666] mb-1">Capacity Status</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-[#2F2F2F]">{remaining} slots left</span>
                      <span className="text-xs font-bold px-2 py-1 bg-[#F3F4F6] text-[#666666] rounded-lg">
                        {slot.current_bookings} / {slot.max_bookings}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
                  <button
                    onClick={() => handleBook(slot.id)}
                    disabled={isFull || !selectedLotId || bookingSlotId === slot.id}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                      isFull 
                        ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                        : 'bg-[#8FAF5A] hover:bg-[#7A994B] text-white disabled:opacity-70'
                    }`}
                  >
                    {bookingSlotId === slot.id ? (
                      <><Loader2 size={16} className="animate-spin" /> Booking...</>
                    ) : isFull ? (
                      'Slot Full'
                    ) : (
                      <><CheckCircle2 size={16} /> Book Slot</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
