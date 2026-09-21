import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertTriangle, ArrowLeft, Users, CheckCircle2, ShieldCheck, Check, Save } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function BuyerMatches() {
  const { lotId } = useParams()
  const { session, user } = useAuth()
  
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null) // tracks ID of match being updated

  const backendUrl = API_BASE_URL;
  const isFarmer = user?.role === 'farmer'
  const isBuyer = user?.role === 'buyer'

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const res = await fetch(`${backendUrl}/api/matches/${lotId}`, { headers })
      const data = await res.json()
      
      if (res.ok) {
        setMatches(data.data || data)
      } else {
        setError(data.error || 'Failed to fetch buyer matches.')
      }
    } catch (err) {
      setError('A network error occurred while fetching matches.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId, session, backendUrl])

  const handleUpdateStatus = async (match, newStatus) => {
    setUpdating(match.buyer_id)
    setError('')
    
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      // The API accepts 'new' if it's an unpersisted match
      const endpointId = match.id || 'new'
      
      const res = await fetch(`${backendUrl}/api/matches/${endpointId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          lot_id: match.lot_id,
          buyer_id: match.buyer_id,
          match_score: match.match_score,
          match_reasons: match.match_reasons,
          status: newStatus
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        // Refresh the list to get updated persisted records
        await fetchMatches()
      } else {
        setError(data.error || 'Failed to update match status.')
      }
    } catch (err) {
      setError('A network error occurred while updating the match.')
    } finally {
      setUpdating(null)
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
        <Link to={`/produce/${lotId}`} className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#666666] hover:text-[#2F2F2F] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Rule-Based Buyer Matches</h1>
          <p className="text-sm text-[#666666] mt-1 font-medium">Deterministic alignment against active buyer demand.</p>
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF3C7] text-[#D97706] p-4 rounded-xl flex items-start gap-3 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!error && matches.length === 0 ? (
        <div className="p-12 text-center card-base">
          <Users size={32} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#2F2F2F]">No compatible buyers found.</p>
          <p className="text-xs font-medium text-[#666666] mt-1">Rule constraints returned an empty match set.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {matches.map((match) => {
            const isContacted = match.status === 'contacted'
            const isAccepted = match.status === 'accepted'
            const isRejected = match.status === 'rejected'
            const isUpdating = updating === match.buyer_id
            
            return (
              <div key={match.buyer_id} className={`card-base p-6 border-l-4 ${isAccepted ? 'border-l-[#059669]' : 'border-l-[#8FAF5A]'}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  
                  {/* Left Side: Score & Buyer Info */}
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-center min-w-20">
                        <p className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">Rule Match Score</p>
                        <p className="text-2xl font-black text-[#2F2F2F] leading-none mt-1">{match.match_score}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-[#2F2F2F]">
                            {match.buyer_name || 'Verified Buyer'}
                          </h3>
                          {match.is_demo && (
                            <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] text-[10px] font-bold uppercase rounded-md border border-[#FDE68A]">
                              SIH DEMO
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-[#666666] capitalize mt-1">
                          Status: <span className={isAccepted ? 'text-[#059669]' : isRejected ? 'text-[#DC2626]' : 'text-[#2F2F2F]'}>{match.status}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Matching Factors (Reasons) */}
                    <div className="pt-4 border-t border-[#E5E7EB]">
                      <p className="text-xs font-bold text-[#2F2F2F] mb-2 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#8FAF5A]" />
                        Deterministic Factors
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-[#666666]">
                        {Object.entries(match.match_reasons || {}).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-1.5">
                            <Check size={14} className="text-[#8FAF5A] mt-0.5 shrink-0" />
                            <span className="capitalize">{key}: <span className="text-[#2F2F2F]">{value}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side: Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-end gap-2 md:min-w-32 pt-4 border-t border-[#E5E7EB] md:pt-0 md:border-0">
                    {/* Actions for Farmer */}
                    {isFarmer && match.status === 'suggested' && (
                      <button
                        onClick={() => handleUpdateStatus(match, 'contacted')}
                        disabled={isUpdating}
                        className="bg-[#2F2F2F] hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5 w-full md:w-auto"
                      >
                        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : 'Contact Buyer'}
                      </button>
                    )}

                    {/* Actions for Buyer */}
                    {(isBuyer || !isFarmer) && match.status !== 'accepted' && match.status !== 'rejected' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(match, 'accepted')}
                          disabled={isUpdating}
                          className="bg-[#8FAF5A] hover:bg-[#7A994B] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5 w-full md:w-auto"
                        >
                          {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Accept Match</>}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(match, 'rejected')}
                          disabled={isUpdating}
                          className="bg-transparent hover:bg-[#F3F4F6] text-[#666666] border border-[#E5E7EB] px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5 w-full md:w-auto"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    {isAccepted && (
                       <Link to={`/transactions/${match.lot_id}`} className="text-xs font-bold text-[#8FAF5A] hover:text-[#7A994B] underline underline-offset-2">
                         View Transaction
                       </Link>
                    )}
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
