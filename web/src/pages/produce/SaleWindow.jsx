import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertTriangle, ArrowLeft, CheckCircle2, Info, Activity, ShoppingCart, Tag, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function SaleWindow() {
  const { id } = useParams() // Matches App.jsx route param `:id`
  const { session, user } = useAuth()
  
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        setLoading(true)
        const headers = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        
        const res = await fetch(`${backendUrl}/api/lots/${id}/sale-window`, { headers })
        const json = await res.json()
        
        if (res.ok) {
          setRecommendation(json.data)
        } else {
          setError(json.error || 'Failed to generate recommendation.')
        }
      } catch (err) {
        setError('A network error occurred while generating recommendation.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecommendation()
  }, [id, session, backendUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="text-[#8FAF5A] animate-spin" />
      </div>
    )
  }

  const getStatusColor = (recCode) => {
    switch(recCode) {
      case 'SELL_NOW': return 'bg-[#059669] text-white border-[#047857]'
      case 'CONSIDER_WAITING': return 'bg-[#D97706] text-white border-[#B45309]'
      case 'MONITOR_MARKET': return 'bg-[#3B82F6] text-white border-[#2563EB]'
      case 'NOT_APPLICABLE': return 'bg-[#6B7280] text-white border-[#4B5563]'
      default: return 'bg-[#2F2F2F] text-white border-black'
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 pb-4 border-b border-[#E5E7EB]">
        <Link to={`/produce/${id}`} className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#666666] hover:text-[#2F2F2F] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Sale Window</h1>
          <p className="text-sm text-[#666666] mt-1 font-medium">Transparent rule-based market recommendation.</p>
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF3C7] text-[#D97706] p-4 rounded-xl flex items-start gap-3 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!error && recommendation && (
        <div className="space-y-6">
          
          {/* Main Recommendation Header */}
          <div className={`p-8 rounded-2xl border flex flex-col items-center text-center ${getStatusColor(recommendation.recommendation)}`}>
            <h2 className="text-4xl font-black tracking-tight uppercase">
              {recommendation.label}
            </h2>
            <p className="mt-3 text-sm font-medium max-w-lg mx-auto opacity-90 leading-relaxed">
              {recommendation.reason}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[#2F2F2F]">Recommendation Factors</h3>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded-md text-[10px] font-bold text-[#666666] uppercase">
              <Activity size={12} /> Deterministic Rules
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {recommendation.factors.map((factorObj, idx) => {
               
               let Icon = Info
               if (factorObj.factor === 'buyer_demand') Icon = ShoppingCart
               else if (factorObj.factor === 'lot_grade') Icon = Tag
               else if (factorObj.factor === 'market_data') Icon = Activity
               
               let textColor = 'text-[#666666]'
               let iconColor = 'text-[#8A8A8A]'
               
               if (factorObj.result === 'positive' || factorObj.result === 'strong_positive') {
                 textColor = 'text-[#059669]'
                 iconColor = 'text-[#10B981]'
               } else if (factorObj.result === 'negative' || factorObj.result === 'unavailable') {
                 textColor = 'text-[#DC2626]'
                 iconColor = 'text-[#EF4444]'
               }

               return (
                 <div key={idx} className="p-5 bg-white border border-[#E5E7EB] rounded-xl flex items-start gap-3">
                   <div className={`p-2 rounded-lg bg-[#F9FAFB] ${iconColor}`}>
                     <Icon size={18} />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                       {factorObj.factor.replace('_', ' ')}
                     </p>
                     <p className={`text-sm font-semibold ${textColor}`}>
                       {factorObj.detail}
                     </p>
                   </div>
                 </div>
               )
             })}
          </div>

          {/* Integration Links */}
          <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row gap-4">
             <Link 
               to={`/matches/${id}`}
               className="flex-1 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] p-4 rounded-xl flex items-center justify-between transition-colors"
             >
               <div>
                 <p className="text-sm font-bold text-[#2F2F2F]">View Buyer Matches</p>
                 <p className="text-xs font-medium text-[#666666] mt-0.5">Check compatible demand</p>
               </div>
               <ArrowLeft size={16} className="text-[#8A8A8A] rotate-180" />
             </Link>
             <Link 
               to="/mandi"
               className="flex-1 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] p-4 rounded-xl flex items-center justify-between transition-colors"
             >
               <div>
                 <p className="text-sm font-bold text-[#2F2F2F]">Mandi Intelligence</p>
                 <p className="text-xs font-medium text-[#666666] mt-0.5">View live market state</p>
               </div>
               <ArrowLeft size={16} className="text-[#8A8A8A] rotate-180" />
             </Link>
          </div>
          
          <p className="text-xs text-center text-[#8A8A8A] flex items-center justify-center gap-1.5 mt-8">
            <Clock size={12} /> Rule-based calculation generated on-demand at {new Date().toLocaleTimeString()}
          </p>

        </div>
      )}
    </div>
  )
}
