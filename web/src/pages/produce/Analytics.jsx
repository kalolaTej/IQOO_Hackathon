import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, TrendingUp, Package, CheckCircle2, LayoutDashboard, Truck, Clock, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Analytics() {
  const { session, user } = useAuth()
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const headers = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        
        const res = await fetch(`${backendUrl}/api/analytics/post-harvest`, { headers })
        const json = await res.json()
        
        if (res.ok) {
          setData(json.data)
        } else {
          setError(json.error || 'Failed to fetch analytics.')
        }
      } catch (err) {
        setError('A network error occurred.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [session, backendUrl])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 h-full">
        <Loader2 size={40} className="text-[#8FAF5A] animate-spin mb-4" />
        <p className="text-[#666666] font-medium animate-pulse">Loading Operational Analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-[#FEF3C7] text-[#D97706] p-6 rounded-2xl flex items-start gap-4 border border-[#FCD34D]">
          <AlertTriangle className="shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-bold">Analytics Error</h3>
            <p className="text-sm font-medium mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.summary.total_lots === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 pb-6 border-b border-[#E5E7EB] mb-8">
          <div className="p-3 bg-[#8FAF5A]/10 text-[#8FAF5A] rounded-xl">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#2F2F2F] tracking-tight">Post-Harvest Analytics</h1>
            <p className="text-[#666666] mt-1 font-medium text-sm">Operational insights and performance metrics.</p>
          </div>
        </div>
        <div className="p-16 text-center bg-white border border-[#E5E7EB] rounded-3xl shadow-sm">
          <div className="inline-flex p-4 bg-[#F9FAFB] rounded-full mb-4 border border-[#E5E7EB]">
            <TrendingUp size={48} className="text-[#9CA3AF]" />
          </div>
          <h3 className="text-xl font-extrabold text-[#2F2F2F]">No Data Available</h3>
          <p className="text-[#666666] mt-2 max-w-sm mx-auto">There is no post-harvest data available yet to generate analytics.</p>
        </div>
      </div>
    )
  }

  const { summary, grades, crops, procurement, transactions, incidents, matches } = data

  const StatCard = ({ title, value, icon, bg = "bg-white", textColor = "text-[#2F2F2F]" }) => (
    <div className={`${bg} p-6 rounded-3xl border border-[#E5E7EB] shadow-sm flex items-center justify-between`}>
      <div>
        <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">{title}</p>
        <p className={`text-3xl font-black ${textColor}`}>{value}</p>
      </div>
      <div className="p-3 bg-[#F8FAFC] rounded-2xl text-[#64748B] border border-[#E2E8F0]">
        {icon}
      </div>
    </div>
  )

  const MetricRow = ({ label, value, colorClass = "text-[#2F2F2F]" }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-[#F1F5F9] last:border-0">
      <span className="text-sm font-semibold text-[#64748B]">{label}</span>
      <span className={`text-sm font-extrabold ${colorClass}`}>{value}</span>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#8FAF5A] to-[#6b853f] text-white rounded-2xl shadow-sm">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#2F2F2F] tracking-tight">Analytics Dashboard</h1>
            <p className="text-[#666666] mt-1 font-medium text-sm">Real-time operational insights and metrics.</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#64748B] shadow-inner">
          Data scope: {user?.role === 'farmer' ? 'My Farms' : 'All Operations'}
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Lots" 
          value={summary.total_lots} 
          icon={<Package size={20} />} 
        />
        <StatCard 
          title="Total Volume (kg)" 
          value={summary.total_quantity_kg.toLocaleString()} 
          icon={<TrendingUp size={20} />} 
        />
        <StatCard 
          title="Booked Lots" 
          value={summary.booked_lots} 
          icon={<CheckCircle2 size={20} />} 
        />
        <StatCard 
          title="Sold Lots" 
          value={summary.sold_lots} 
          icon={<Truck size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lot Status Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-lg font-extrabold text-[#2F2F2F] mb-6 flex items-center gap-2">
            Lot Status
          </h3>
          <div className="space-y-1">
            <MetricRow label="Listed" value={summary.listed_lots} colorClass="text-blue-600" />
            <MetricRow label="Booked" value={summary.booked_lots} colorClass="text-purple-600" />
            <MetricRow label="Matched" value={summary.matched_lots} colorClass="text-yellow-600" />
            <MetricRow label="Sold" value={summary.sold_lots} colorClass="text-green-600" />
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-lg font-extrabold text-[#2F2F2F] mb-6 flex items-center gap-2">
            Quality Grades
          </h3>
          <div className="space-y-1">
            <MetricRow label="Grade A" value={grades.A} colorClass="text-[#10B981]" />
            <MetricRow label="Grade B" value={grades.B} colorClass="text-[#3B82F6]" />
            <MetricRow label="Grade C" value={grades.C} colorClass="text-[#F59E0B]" />
            <MetricRow label="Ungraded" value={grades.ungraded} colorClass="text-[#9CA3AF]" />
          </div>
        </div>

        {/* Procurement Bookings */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-lg font-extrabold text-[#2F2F2F] mb-6 flex items-center gap-2">
            Procurement Queue
          </h3>
          <div className="flex items-end justify-between mb-6 pb-6 border-b border-[#F1F5F9]">
            <span className="text-sm font-bold text-[#64748B]">Total Bookings</span>
            <span className="text-3xl font-black text-[#2F2F2F]">{procurement.total_bookings}</span>
          </div>
          <div className="space-y-1">
            <MetricRow label="Waiting" value={procurement.waiting} colorClass="text-yellow-600" />
            <MetricRow label="In Progress" value={procurement.in_progress} colorClass="text-blue-600" />
            <MetricRow label="Completed" value={procurement.completed} colorClass="text-green-600" />
            <MetricRow label="Cancelled" value={procurement.cancelled} colorClass="text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Crop Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-lg font-extrabold text-[#2F2F2F] mb-6">Crop Breakdown</h3>
          {crops.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F5F9]">
                    <th className="pb-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">Crop</th>
                    <th className="pb-3 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Lots</th>
                    <th className="pb-3 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Quantity (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {crops.map((crop, idx) => (
                    <tr key={idx}>
                      <td className="py-3 text-sm font-bold text-[#2F2F2F] capitalize">{crop.crop_type}</td>
                      <td className="py-3 text-sm font-bold text-[#64748B] text-right">{crop.lot_count}</td>
                      <td className="py-3 text-sm font-black text-[#8FAF5A] text-right">{crop.quantity_kg.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#9CA3AF] font-medium text-center py-6">No crop data.</p>
          )}
        </div>

        {/* Transactions & Financials */}
        <div className="bg-[#111827] text-white p-6 rounded-3xl border border-[#374151] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8FAF5A]/20 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2 relative z-10">
            Financial & Transactions
          </h3>
          
          <div className="grid grid-cols-2 gap-8 relative z-10">
            <div>
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-4">Total Revenue</p>
              <p className="text-4xl font-black text-[#10B981]">
                ₹{transactions.total_amount.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-[#6B7280] mt-2">from {transactions.total} transactions</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2 pb-2 border-b border-[#374151]">Payments</p>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-semibold text-[#9CA3AF]">Paid</span>
                <span className="text-sm font-extrabold text-[#10B981]">{transactions.paid}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-semibold text-[#9CA3AF]">Partial</span>
                <span className="text-sm font-extrabold text-[#F59E0B]">{transactions.partial}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-semibold text-[#9CA3AF]">Unpaid</span>
                <span className="text-sm font-extrabold text-[#EF4444]">{transactions.unpaid}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buyer Matches */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-lg font-extrabold text-[#2F2F2F] mb-6 flex items-center gap-2">
            Buyer Matches
          </h3>
          <div className="flex items-end justify-between mb-6 pb-6 border-b border-[#F1F5F9]">
            <span className="text-sm font-bold text-[#64748B]">Total Connections</span>
            <span className="text-3xl font-black text-[#2F2F2F]">{matches.total}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricRow label="Suggested" value={matches.suggested} colorClass="text-gray-600" />
            <MetricRow label="Contacted" value={matches.contacted} colorClass="text-blue-600" />
            <MetricRow label="Accepted" value={matches.accepted} colorClass="text-green-600" />
            <MetricRow label="Rejected" value={matches.rejected} colorClass="text-red-600" />
          </div>
        </div>

        {/* Incidents */}
        <div className="bg-white p-6 rounded-3xl border border-[#FCA5A5] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <AlertCircle size={120} />
          </div>
          <h3 className="text-lg font-extrabold text-[#991B1B] mb-6 flex items-center gap-2">
            Reported Incidents
          </h3>
          <div className="flex items-end justify-between mb-6 pb-6 border-b border-[#FEE2E2]">
            <span className="text-sm font-bold text-[#B91C1C]">Total Events</span>
            <span className="text-3xl font-black text-[#991B1B]">{incidents.total}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricRow label="Open" value={incidents.open} colorClass="text-[#DC2626]" />
            <MetricRow label="Investigating" value={incidents.investigating} colorClass="text-[#7C3AED]" />
            <MetricRow label="Resolved" value={incidents.resolved} colorClass="text-[#059669]" />
            <MetricRow label="Dismissed" value={incidents.dismissed} colorClass="text-gray-600" />
            <MetricRow label="Critical" value={incidents.critical} colorClass="text-[#991B1B]" />
          </div>
        </div>
      </div>
      
    </div>
  )
}
