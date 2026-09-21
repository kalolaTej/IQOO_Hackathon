import { useState, useEffect, useCallback } from 'react'
import {
  Truck,
  Building,
  ThermometerSnowflake,
  ShieldCheck,
  Star,
  MapPin,
  RefreshCw,
  Info,
  CheckCircle2,
  Phone,
  Package,
  Calculator,
  DollarSign,
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import { API_BASE_URL } from '../../lib/api'

export default function LogisticsSuggestion() {
  const [selectedLotId, setSelectedLotId] = useState('11111111-1111-1111-1111-111111111111')
  const [suggestion, setSuggestion] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ROI Calculator State
  const [calcQty, setCalcQty] = useState('2000')
  const [calcDays, setCalcDays] = useState('7')
  const [calcCostPerDay, setCalcCostPerDay] = useState('350')
  const [calcMandiRate, setCalcMandiRate] = useState('2500')
  const [calcExpectedRise, setCalcExpectedRise] = useState('10')
  const [roiResult, setRoiResult] = useState(null)
  const [calcLoading, setCalcLoading] = useState(false)

  const demoLots = [
    { id: '11111111-1111-1111-1111-111111111111', crop_type: 'Tomato (Perishable)', quantity_kg: 1200, state: 'Maharashtra' },
    { id: '22222222-2222-2222-2222-222222222222', crop_type: 'Wheat (Bulk Grain)', quantity_kg: 6000, state: 'Madhya Pradesh' },
    { id: '33333333-3333-3333-3333-333333333333', crop_type: 'Onion (Semi-Perishable)', quantity_kg: 2500, state: 'Maharashtra' },
    { id: '44444444-4444-4444-4444-444444444444', crop_type: 'Soybean (Dry Produce)', quantity_kg: 4000, state: 'Madhya Pradesh' }
  ]

  const fetchSuggestion = useCallback(async (lotId) => {
    setLoading(true)
    setError(null)
    try {
      const [sugRes, facRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/lots/${lotId}/logistics-suggestion`),
        fetch(`${API_BASE_URL}/api/logistics/facilities`)
      ])

      if (sugRes.ok) {
        const sData = await sugRes.json()
        setSuggestion(sData)
      }

      if (facRes.ok) {
        const fData = await facRes.json()
        setFacilities(Array.isArray(fData) ? fData : [])
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch logistics suggestion')
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateROI = useCallback(async () => {
    setCalcLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/logistics/calculate-roi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity_kg: parseFloat(calcQty) || 1000,
          holding_days: parseInt(calcDays, 10) || 5,
          cost_per_day: parseFloat(calcCostPerDay) || 300,
          current_price_per_qtl: parseFloat(calcMandiRate) || 2500,
          expected_price_rise_pct: parseFloat(calcExpectedRise) || 8
        })
      })
      if (res.ok) {
        const data = await res.json()
        setRoiResult(data)
      }
    } catch {
      // safe fallback
    } finally {
      setCalcLoading(false)
    }
  }, [calcQty, calcDays, calcCostPerDay, calcMandiRate, calcExpectedRise])

  useEffect(() => {
    fetchSuggestion(selectedLotId)
  }, [selectedLotId, fetchSuggestion])

  useEffect(() => {
    calculateROI()
  }, [calculateROI])

  const getFacilityIcon = (type) => {
    if (type === 'cold_storage') return <ThermometerSnowflake className="w-5 h-5 text-blue-600" />
    if (type === 'transport_provider') return <Truck className="w-5 h-5 text-emerald-600" />
    return <Building className="w-5 h-5 text-amber-600" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Logistics, Storage & ROI Advisory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Rule-based multi-attribute facility recommendations with financial Storage ROI & Net Profitability Calculator.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          Storage Economics Engine
        </span>
      </div>

      {/* Lot Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Select Produce Lot for Facility Recommendation
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {demoLots.map((lot) => (
            <button
              key={lot.id}
              onClick={() => setSelectedLotId(lot.id)}
              className={`p-3 text-left rounded-lg border text-sm transition-colors ${
                selectedLotId === lot.id
                  ? 'border-emerald-600 bg-emerald-50 text-slate-900 font-semibold ring-1 ring-emerald-600'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="font-bold">{lot.crop_type}</div>
              <div className="text-xs text-slate-500 mt-1">{lot.quantity_kg.toLocaleString()} kg · {lot.state}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm text-slate-500">Scoring facilities by perishability, capacity, and proximity...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      ) : suggestion && (
        <div className="space-y-6">
          {/* Top Recommended Facility Card */}
          {suggestion.recommended && (
            <div className="bg-white p-6 rounded-xl border-2 border-emerald-500 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    {getFacilityIcon(suggestion.recommended.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">
                        {suggestion.recommended.facility_name}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-600 text-white">
                        Top Recommendation
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 capitalize">
                      Type: {suggestion.recommended.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">
                    ₹{suggestion.recommended.cost_per_day}
                    <span className="text-xs font-normal text-slate-500"> / day</span>
                  </div>
                  <div className="text-xs text-slate-500">~{suggestion.recommended.distance_km} km away</div>
                </div>
              </div>

              {/* Rationale */}
              <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-slate-800 text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-emerald-950">Recommendation Basis: </strong>
                  {suggestion.recommended.reason}
                </div>
              </div>
            </div>
          )}

          {/* Alternatives Grid */}
          {suggestion.alternatives && suggestion.alternatives.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-slate-900">Alternative Facilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestion.alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getFacilityIcon(alt.type)}
                        <h4 className="font-bold text-slate-900 text-sm">{alt.facility_name}</h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Rate: ₹{alt.cost_per_day}/day</span>
                      <span>Distance: ~{alt.distance_km} km</span>
                    </div>

                    <p className="text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                      {alt.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW FEATURE: Storage ROI Financial Calculator */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Storage Financial ROI Calculator</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Evaluate whether paying for cold storage / warehouse rent produces positive net profit after expected mandi appreciation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Lot Quantity (kg)</label>
                <input
                  type="number"
                  value={calcQty}
                  onChange={(e) => setCalcQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Storage Days</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={calcDays}
                  onChange={(e) => setCalcDays(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Facility Rent (₹/day)</label>
                <input
                  type="number"
                  value={calcCostPerDay}
                  onChange={(e) => setCalcCostPerDay(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Current Rate (₹/qtl)</label>
                <input
                  type="number"
                  value={calcMandiRate}
                  onChange={(e) => setCalcMandiRate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Expected Rise (%)</label>
                <input
                  type="number"
                  value={calcExpectedRise}
                  onChange={(e) => setCalcExpectedRise(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {roiResult && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Total Storage Expense</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">₹{roiResult.total_storage_cost.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{roiResult.holding_days} days × ₹{calcCostPerDay}/day</div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="text-xs text-blue-800 font-medium">Gross Mandi Gain</div>
                    <div className="text-xl font-bold text-blue-950 mt-1">+₹{roiResult.gross_price_gain.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-blue-700 mt-0.5">From +{calcExpectedRise}% rate appreciation</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${roiResult.is_profitable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`text-xs font-medium ${roiResult.is_profitable ? 'text-emerald-800' : 'text-red-800'}`}>
                      Net Profit / Loss After Storage
                    </div>
                    <div className={`text-xl font-bold mt-1 ${roiResult.is_profitable ? 'text-emerald-950' : 'text-red-950'}`}>
                      {roiResult.net_profit_or_loss >= 0 ? `+₹${roiResult.net_profit_or_loss.toLocaleString('en-IN')}` : `-₹${Math.abs(roiResult.net_profit_or_loss).toLocaleString('en-IN')}`}
                    </div>
                    <div className={`text-xs mt-0.5 ${roiResult.is_profitable ? 'text-emerald-700' : 'text-red-700'}`}>
                      {roiResult.is_profitable ? 'Profitable Storage' : 'Loss on Storage'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Projected Lot Valuation</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">₹{roiResult.projected_lot_value.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Base: ₹{roiResult.initial_lot_value.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm">
                  <strong>Economic Verdict: </strong> {roiResult.recommendation}
                </div>
              </div>
            )}
          </div>

          {/* All Seeded Logistics Facilities Directory */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Storage & Transit Network Directory ({facilities.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Facility</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Location & State</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Daily Cost</th>
                    <th className="px-4 py-3">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facilities.map((f) => (
                    <tr key={f.id || f.facility_name} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900">{f.facility_name}</td>
                      <td className="px-4 py-3 capitalize text-xs">{f.type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-xs">{f.location}, {f.state}</td>
                      <td className="px-4 py-3 text-xs">{parseFloat(f.capacity_kg).toLocaleString()} kg</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">₹{f.cost_per_day}/day</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{f.contact_phone || '+91-9876543210'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
