import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  PlusCircle,
  Building2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Package,
  Award,
  Phone,
  RefreshCw
} from 'lucide-react'
import { API_BASE_URL } from '../../lib/api'

export default function BuyerProfile() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    buyer_name: '',
    company_name: '',
    crop_type: 'Tomato',
    min_quantity_kg: '1000',
    preferred_grade: 'A',
    location: '',
    state: 'Maharashtra',
    contact_phone: ''
  })

  const commonCrops = ['Tomato', 'Wheat', 'Onion', 'Potato', 'Rice', 'Soybean', 'Cotton']
  const indianStates = ['Maharashtra', 'Madhya Pradesh', 'Andhra Pradesh', 'Gujarat', 'Haryana', 'Punjab', 'Uttar Pradesh', 'Karnataka', 'Tamil Nadu', 'Keralam']

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/buyer-profile`)
      if (res.ok) {
        const data = await res.json()
        setProfiles(Array.isArray(data) ? data : [])
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')

    if (!formData.crop_type || !formData.min_quantity_kg || !formData.location) {
      setErrorMsg('Please complete all required fields.')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/buyer-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          min_quantity_kg: parseFloat(formData.min_quantity_kg)
        })
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `HTTP ${res.status}`)
      }

      const created = await res.json()
      setSuccessMsg(`Demand profile for ${created.crop_type} registered successfully!`)
      setFormData({
        buyer_name: '',
        company_name: '',
        crop_type: 'Tomato',
        min_quantity_kg: '1000',
        preferred_grade: 'A',
        location: '',
        state: 'Maharashtra',
        contact_phone: ''
      })
      fetchProfiles()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit buyer demand profile.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buyer & FPO Demand Profiles</h1>
        <p className="text-sm text-slate-500 mt-1">
          Post institutional procurement requirements to match with harvested farm lots across regional mandis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Box */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Post Demand Profile</h2>
          </div>

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Buyer / Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={formData.buyer_name}
                onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company / FPO Name
              </label>
              <input
                type="text"
                placeholder="e.g. FreshSupply Agri FPO"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Required Crop *
                </label>
                <select
                  value={formData.crop_type}
                  onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {commonCrops.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Grade
                </label>
                <select
                  value={formData.preferred_grade}
                  onChange={(e) => setFormData({ ...formData, preferred_grade: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="A">Grade A (Premium)</option>
                  <option value="B">Grade B (Standard)</option>
                  <option value="C">Grade C (Commercial)</option>
                  <option value="any">Any Grade</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Min Quantity (kg) *
              </label>
              <input
                type="number"
                min="100"
                step="50"
                value={formData.min_quantity_kg}
                onChange={(e) => setFormData({ ...formData, min_quantity_kg: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City / Location *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nashik"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {indianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Contact
              </label>
              <input
                type="text"
                placeholder="+91-9876543210"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Registering Profile...' : 'Save Demand Profile'}
            </button>
          </form>
        </div>

        {/* Existing Profiles List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Active Procurement Profiles ({profiles.length})
              </h2>
              <p className="text-xs text-slate-500">Verified buyer and FPO demand requirements</p>
            </div>
            <button
              onClick={fetchProfiles}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
              <p className="text-xs">Loading buyer profiles...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm">No buyer profiles registered yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{p.company_name || p.buyer_name}</h3>
                      <p className="text-xs text-slate-500">{p.buyer_name}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {p.crop_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      <span>Min: {parseFloat(p.min_quantity_kg).toLocaleString()} kg</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>Grade: {p.preferred_grade}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.location}, {p.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.contact_phone || 'Available on match'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
