import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertTriangle, ArrowLeft, Receipt, CheckCircle2, Save } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Transactions() {
  const { lotId } = useParams()
  const { user, session } = useAuth()
  
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [procurementStatus, setProcurementStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [amount, setAmount] = useState('')

  const backendUrl = API_BASE_URL;

  const canEdit = user?.role === 'procurement_operator' || user?.role === 'admin'

  const fetchTransaction = async () => {
    try {
      const headers = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const res = await fetch(`${backendUrl}/api/transactions/${lotId}`, { headers })
      const data = await res.json()
      
      if (res.ok) {
        setTransaction(data.data || data)
        setProcurementStatus(data.data?.procurement_status || data.procurement_status)
        setPaymentStatus(data.data?.payment_status || data.payment_status)
        setAmount(data.data?.amount ?? data.amount ?? '')
        setError('')
      } else if (res.status === 404) {
        setNotFound(true)
      } else {
        setError(data.error || 'Failed to fetch transaction')
      }
    } catch (err) {
      setError('A network error occurred while fetching the transaction')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransaction()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId, session, backendUrl])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const payload = {}
      if (procurementStatus !== transaction.procurement_status) payload.procurement_status = procurementStatus
      if (paymentStatus !== transaction.payment_status) payload.payment_status = paymentStatus
      if (amount !== '' && Number(amount) !== Number(transaction.amount)) payload.amount = Number(amount)

      if (Object.keys(payload).length === 0) {
        setIsEditing(false)
        setSaving(false)
        return
      }

      const res = await fetch(`${backendUrl}/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setTransaction(data.data || data)
        setIsEditing(false)
      } else {
        setError(data.error || 'Failed to update transaction')
        // Reset form to safe DB state
        setProcurementStatus(transaction.procurement_status)
        setPaymentStatus(transaction.payment_status)
        setAmount(transaction.amount ?? '')
      }
    } catch (err) {
      setError('A network error occurred while updating the transaction')
    } finally {
      setSaving(false)
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-4">
          <Link to={`/produce/${lotId}`} className="p-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[#666666] hover:text-[#2F2F2F] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#2F2F2F] tracking-tight">Procurement Transaction</h1>
            <p className="text-sm text-[#666666] mt-1 font-medium">Status and payment tracking for your harvest.</p>
          </div>
        </div>
        
        {canEdit && transaction && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-[#2F2F2F] hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            Update Status
          </button>
        )}
      </div>

      {error && (
        <div className="bg-[#FEF3C7] text-[#D97706] p-4 rounded-xl flex items-start gap-3 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {notFound ? (
        <div className="p-12 text-center card-base">
          <Receipt size={32} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#2F2F2F]">Transaction not available yet.</p>
          <p className="text-xs text-[#666666] mt-2 max-w-sm mx-auto font-medium">
            This produce lot has not been assigned a procurement transaction. It will appear here once the matching workflow begins.
          </p>
        </div>
      ) : transaction ? (
        <div className="card-base p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Procurement Status */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#666666]">Procurement Status</p>
              {isEditing ? (
                <select 
                  value={procurementStatus}
                  onChange={(e) => setProcurementStatus(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#2F2F2F] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/50 transition-all font-medium"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize ${
                    transaction.procurement_status === 'completed' ? 'bg-[#ECFDF5] text-[#059669]' :
                    transaction.procurement_status === 'in_progress' ? 'bg-[#FEF3C7] text-[#D97706]' :
                    'bg-[#F3F4F6] text-[#666666]'
                  }`}>
                    {transaction.procurement_status.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#666666]">Payment Tracking</p>
              {isEditing ? (
                <select 
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#2F2F2F] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/50 transition-all font-medium"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize ${
                    transaction.payment_status === 'paid' ? 'bg-[#ECFDF5] text-[#059669]' :
                    transaction.payment_status === 'partial' ? 'bg-[#FEF3C7] text-[#D97706]' :
                    'bg-[#FEE2E2] text-[#DC2626]'
                  }`}>
                    {transaction.payment_status}
                  </span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#666666]">Transaction Amount (₹)</p>
              {isEditing ? (
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#2F2F2F] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8FAF5A]/50 transition-all font-medium"
                />
              ) : (
                <p className="text-2xl font-black text-[#2F2F2F]">
                  {transaction.amount !== null && transaction.amount !== undefined 
                    ? `₹${Number(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                    : '₹0.00'}
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5E7EB] flex items-center justify-between">
            <p className="text-xs text-[#8A8A8A] font-medium">
              Last updated: {new Date(transaction.updated_at).toLocaleString()}
            </p>
            
            {isEditing && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="text-sm font-bold text-[#666666] hover:text-[#2F2F2F] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#8FAF5A] hover:bg-[#7A994B] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-70"
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Changes</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
