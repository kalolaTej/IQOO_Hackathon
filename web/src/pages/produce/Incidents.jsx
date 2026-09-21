import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertTriangle, ArrowLeft, Plus, Clock, Info, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { io } from 'socket.io-client'

const getSeverityColor = (severity) => {
  switch(severity) {
    case 'low': return 'text-green-600 bg-green-50 border-green-200'
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'critical': return 'text-red-600 bg-red-50 border-red-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const getStatusColor = (status) => {
  switch(status) {
    case 'open': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'investigating': return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'resolved': return 'text-green-600 bg-green-50 border-green-200'
    case 'dismissed': return 'text-gray-600 bg-gray-50 border-gray-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

function IncidentCard({ incident, session, backendUrl, userRole }) {
  const [status, setStatus] = useState(incident.status)
  const [severity, setSeverity] = useState(incident.severity)
  const [notes, setNotes] = useState(incident.resolution_notes || '')
  
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')

  useEffect(() => {
    setStatus(incident.status)
    setSeverity(incident.severity)
    setNotes(incident.resolution_notes || '')
  }, [incident])

  const canEdit = userRole === 'procurement_operator' || userRole === 'admin'
  const isClosed = incident.status === 'resolved' || incident.status === 'dismissed'

  const allowedStatuses = {
    open: ['open', 'investigating', 'resolved', 'dismissed'],
    investigating: ['investigating', 'resolved', 'dismissed'],
    resolved: ['resolved'],
    dismissed: ['dismissed']
  }[incident.status] || [incident.status]

  const handleUpdate = async () => {
    try {
      setUpdating(true)
      setUpdateError('')
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const payload = {
        status,
        severity,
        resolution_notes: notes
      }

      const res = await fetch(`${backendUrl}/api/incidents/${incident.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) {
        setUpdateError(json.error || 'Failed to update incident.')
      }
      // Success will emit 'incident-updated' and the parent will refetch
    } catch(err) {
      setUpdateError('A network error occurred while updating.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-[#E5E7EB]">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-extrabold text-[#2F2F2F] capitalize">
              {incident.incident_type.replace('_', ' ')}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#8A8A8A] mt-1 font-medium">
              <Clock size={12} />
              <span>Reported: {new Date(incident.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>By: {incident.users?.name || 'Unknown User'}</span>
            </div>
          </div>
          
          {/* Read-only badges for everyone, replaced by controls if editing */}
          {!canEdit && (
            <div className="flex flex-col items-end gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${getStatusColor(incident.status)}`}>
                Status: {incident.status}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${getSeverityColor(incident.severity)}`}>
                Severity: {incident.severity}
              </span>
            </div>
          )}
        </div>
        <p className="text-[#4B5563] text-sm mt-4 font-medium leading-relaxed bg-[#F9FAFB] p-4 rounded-xl border border-[#F3F4F6]">
          {incident.description}
        </p>
      </div>
      
      {/* Read-only notes for farmers */}
      {!canEdit && incident.resolution_notes && (
        <div className="p-5 bg-[#F8FAFC]">
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-2">
            <Info size={14} /> Resolution Notes
          </h4>
          <p className="text-[#334155] text-sm font-medium">
            {incident.resolution_notes}
          </p>
        </div>
      )}

      {/* Management Controls for Operators/Admins */}
      {canEdit && (
        <div className="p-5 bg-[#F8FAFC] border-t border-[#E5E7EB] space-y-4">
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
            Management Controls
          </h4>
          
          {updateError && (
            <div className="text-[#D97706] text-xs font-bold bg-[#FEF3C7] p-2 rounded-md border border-[#FCD34D]">
              {updateError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#64748B] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isClosed || updating}
                className="w-full p-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#8FAF5A] disabled:opacity-60"
              >
                {allowedStatuses.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#64748B] mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                disabled={updating}
                className="w-full p-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#8FAF5A] disabled:opacity-60"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">Resolution Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={updating}
              rows={2}
              placeholder="Add investigation or resolution notes..."
              className="w-full p-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#8FAF5A] disabled:opacity-60 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpdate}
              disabled={updating || (status === incident.status && severity === incident.severity && notes === (incident.resolution_notes || ''))}
              className="px-4 py-2 bg-[#2F2F2F] text-white text-sm font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {updating ? <Loader2 size={14} className="animate-spin" /> : null}
              {updating ? 'Updating...' : 'Update Incident'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Incidents() {
  const { id } = useParams() // lot_id
  const { session, user } = useAuth()
  
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const backendUrl = API_BASE_URL;

  const fetchIncidents = async () => {
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const res = await fetch(`${backendUrl}/api/incidents/${id}`, { headers })
      const json = await res.json()
      
      if (res.ok) {
        setIncidents(json.data || [])
      } else {
        setError(json.error || 'Failed to fetch incidents.')
      }
    } catch (err) {
      setError('A network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
    
    // Setup Socket.io for realtime updates
    const socket = io(SOCKET_URL || backendUrl || (typeof window !== 'undefined' ? window.location.origin : ''))
    
    socket.on('incident-updated', (payload) => {
      if (payload && payload.lot_id === id) {
        fetchIncidents()
      }
    })

    return () => {
      socket.off('incident-updated')
      socket.disconnect()
    }
  }, [id, session, backendUrl])

  if (loading && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="text-[#8FAF5A] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-4">
          <Link to={`/produce/${id}`} className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#666666] hover:text-[#2F2F2F] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Incidents</h1>
            <p className="text-sm text-[#666666] mt-1 font-medium">Unified event history for this lot.</p>
          </div>
        </div>
        <Link 
          to={`/produce/${id}/incidents/report`}
          className="flex items-center gap-2 px-4 py-2 bg-[#8FAF5A] text-white rounded-xl font-bold hover:bg-[#7A9648] transition-colors"
        >
          <Plus size={18} />
          <span>Report Incident</span>
        </Link>
      </div>

      {error && (
        <div className="bg-[#FEF3C7] text-[#D97706] p-4 rounded-xl flex items-start gap-3 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!error && incidents.length === 0 && (
        <div className="p-12 text-center bg-white border border-[#E5E7EB] rounded-2xl">
          <CheckCircle2 size={48} className="mx-auto text-[#10B981] mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-[#2F2F2F]">No incidents reported</h3>
          <p className="text-sm text-[#666666] mt-1">This lot currently has no active or historical issues.</p>
        </div>
      )}

      <div className="space-y-4">
        {incidents.map((incident) => (
          <IncidentCard 
            key={incident.id} 
            incident={incident} 
            session={session} 
            backendUrl={backendUrl} 
            userRole={user?.role} 
          />
        ))}
      </div>
    </div>
  )
}
