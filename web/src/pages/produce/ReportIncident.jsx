import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function ReportIncident() {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()

  const [type, setType] = useState('damage')
  const [severity, setSeverity] = useState('medium')
  const [description, setDescription] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const backendUrl = API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) {
      setError('Description cannot be empty.')
      return
    }

    try {
      setLoading(true)
      setError('')
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const payload = {
        lot_id: id,
        incident_type: type,
        description,
        severity
      }

      const res = await fetch(`${backendUrl}/api/incidents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      const json = await res.json()

      if (res.ok) {
        navigate(`/produce/${id}/incidents`)
      } else {
        setError(json.error || 'Failed to submit incident.')
      }
    } catch (err) {
      setError('A network error occurred while submitting.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 pb-4 border-b border-[#E5E7EB]">
        <Link to={`/produce/${id}/incidents`} className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#666666] hover:text-[#2F2F2F] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Report Incident</h1>
          <p className="text-sm text-[#666666] mt-1 font-medium">File a new issue for this produce lot.</p>
        </div>
      </div>

      {error && (
        <div className="bg-[#FEF3C7] text-[#D97706] p-4 rounded-xl flex items-start gap-3 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
        
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2F2F2F]">Incident Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 border border-[#E5E7EB] rounded-xl bg-[#F9FAFB] text-[#2F2F2F] font-medium focus:ring-2 focus:ring-[#8FAF5A] focus:outline-none"
          >
            <option value="damage">Damage</option>
            <option value="spoilage">Spoilage</option>
            <option value="rejection">Rejection</option>
            <option value="procurement_issue">Procurement Issue</option>
            <option value="queue_issue">Queue Issue</option>
            <option value="payment_issue">Payment Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2F2F2F]">Severity</label>
          <select 
            value={severity} 
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full p-3 border border-[#E5E7EB] rounded-xl bg-[#F9FAFB] text-[#2F2F2F] font-medium focus:ring-2 focus:ring-[#8FAF5A] focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2F2F2F]">Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the issue in detail..."
            className="w-full p-3 border border-[#E5E7EB] rounded-xl bg-[#F9FAFB] text-[#2F2F2F] font-medium focus:ring-2 focus:ring-[#8FAF5A] focus:outline-none resize-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-[#8FAF5A] hover:bg-[#7A9648] text-white font-extrabold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Submitting...' : 'Submit Incident'}
        </button>
      </form>
    </div>
  )
}
