import { useState, useEffect, useCallback } from 'react'
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Package,
  Layers,
  ArrowRight,
  Info,
  Sliders,
  DollarSign,
  ShieldAlert,
  Thermometer,
  CloudSun
} from 'lucide-react'
import { API_BASE_URL } from '../../lib/api'

export default function SaleWindow() {
  const [selectedLotId, setSelectedLotId] = useState('11111111-1111-1111-1111-111111111111')
  const [lots, setLots] = useState([
    { id: '11111111-1111-1111-1111-111111111111', crop_type: 'Tomato', quantity_kg: 1200, grade: 'A', harvest_date: '2 days ago' },
    { id: '22222222-2222-2222-2222-222222222222', crop_type: 'Wheat', quantity_kg: 6000, grade: 'A', harvest_date: '10 days ago' },
    { id: '33333333-3333-3333-3333-333333333333', crop_type: 'Onion', quantity_kg: 2500, grade: 'B', harvest_date: '5 days ago' },
    { id: '44444444-4444-4444-4444-444444444444', crop_type: 'Soybean', quantity_kg: 4000, grade: 'A', harvest_date: '14 days ago' }
  ])
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [trendData, setTrendData] = useState([])

  // Simulator State
  const [simCrop, setSimCrop] = useState('Tomato')
  const [simQty, setSimQty] = useState('1500')
  const [simHarvestDays, setSimHarvestDays] = useState('2')
  const [simStorage, setSimStorage] = useState('ambient')
  const [simWeather, setSimWeather] = useState('normal')
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)

  const commonCrops = ['Tomato', 'Wheat', 'Onion', 'Potato', 'Rice', 'Soybean', 'Cotton', 'Cabbage']

  const fetchSaleWindow = useCallback(async (lotId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/lots/${lotId}/sale-window`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRecommendation(data)

      const currentLot = lots.find((l) => l.id === lotId)
      if (currentLot) {
        const trendRes = await fetch(`${API_BASE_URL}/api/prices/trend?crop=${currentLot.crop_type}`)
        if (trendRes.ok) {
          const tData = await trendRes.json()
          setTrendData(Array.isArray(tData) ? tData : [])
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve sale window recommendation')
    } finally {
      setLoading(false)
    }
  }, [lots])

  const runSimulation = useCallback(async () => {
    setSimLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/sale-window/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_type: simCrop,
          quantity_kg: parseFloat(simQty) || 1000,
          days_since_harvest: parseInt(simHarvestDays, 10) || 1,
          storage_condition: simStorage,
          weather_condition: simWeather
        })
      })
      if (res.ok) {
        const data = await res.json()
        setSimResult(data)
      }
    } catch {
      // safe fallback
    } finally {
      setSimLoading(false)
    }
  }, [simCrop, simQty, simHarvestDays, simStorage, simWeather])

  useEffect(() => {
    fetchSaleWindow(selectedLotId)
  }, [selectedLotId, fetchSaleWindow])

  useEffect(() => {
    runSimulation()
  }, [runSimulation])

  const currentLot = lots.find((l) => l.id === selectedLotId) || lots[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sale-Window & Spoilage Advisory</h1>
        <p className="text-sm text-slate-500 mt-1">
          Rule-based advisory calculating market price trajectory, perishability curves, and holding revenue optimization.
        </p>
      </div>

      {/* Lot Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Select Saved Produce Lot for Instant Analysis
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {lots.map((lot) => {
            const isSelected = lot.id === selectedLotId
            return (
              <button
                key={lot.id}
                onClick={() => setSelectedLotId(lot.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{lot.crop_type}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Grade {lot.grade}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                  <span>{lot.quantity_kg.toLocaleString()} kg</span>
                  <span>Harvest: {lot.harvest_date}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Advisory Result Card */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
          <Clock className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm text-slate-500">Evaluating market momentum & perishability constraints...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      ) : recommendation && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rule-Based Decision
              </span>
              {recommendation.recommendation === 'hold' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <TrendingUp className="w-4 h-4" /> Recommended: HOLD {recommendation.hold_days} DAYS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <CheckCircle2 className="w-4 h-4" /> Recommended: SELL NOW
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Advisory Rationale
              </div>
              <p className="text-base font-medium text-slate-800 leading-relaxed">
                "{recommendation.rationale}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 font-medium">Commodity Profile</div>
                <div className="text-sm font-bold text-slate-900 mt-1">{currentLot.crop_type} (Grade {currentLot.grade})</div>
                <div className="text-xs text-slate-400 mt-0.5">{currentLot.quantity_kg} kg available</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 font-medium">Holding Strategy</div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {recommendation.recommendation === 'hold' ? `Hold ~${recommendation.hold_days} Days` : 'Immediate Mandi Dispatch'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Based on price momentum</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 font-medium">Model Engine</div>
                <div className="text-sm font-bold text-slate-900 mt-1">Weighted Rule Engine</div>
                <div className="text-xs text-slate-400 mt-0.5">Transparent & deterministic</div>
              </div>
            </div>
          </div>

          {/* Side Panel: Price Momentum Context */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Mandi Trend Factor
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Modal rates sampled from regional reporting centers over the recent dispatch cycle.
            </p>

            {trendData.length > 0 ? (
              <div className="space-y-2 pt-2">
                {trendData.slice(-5).map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-600">{t.price_date}</span>
                    <span className="font-bold text-slate-900">₹{t.modal_price.toLocaleString('en-IN')}/qtl</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No trend points available.</p>
            )}

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2 mt-4">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                Recommendation balances holding potential against decay risk. Perishable lots cap at 2-3 days holding.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* NEW FEATURE: Interactive Holding vs Spoilage Profit Simulator */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Custom Lot Holding & Profit Simulator</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate custom lot volume, storage conditions, and weather factors to see projected day-by-day revenue vs spoilage loss.
          </p>
        </div>

        {/* Simulator Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Crop</label>
            <select
              value={simCrop}
              onChange={(e) => setSimCrop(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
            >
              {commonCrops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Lot Size (kg)</label>
            <input
              type="number"
              value={simQty}
              onChange={(e) => setSimQty(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Harvest Age (Days)</label>
            <input
              type="number"
              min="0"
              max="60"
              value={simHarvestDays}
              onChange={(e) => setSimHarvestDays(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Storage Condition</label>
            <select
              value={simStorage}
              onChange={(e) => setSimStorage(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
            >
              <option value="ambient">Ambient / Field Shed (Standard Spoilage)</option>
              <option value="ventilated">Ventilated Dry Store (40% Less Spoilage)</option>
              <option value="cold_storage">Cold Storage Depot (80% Less Spoilage)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Weather Climate</label>
            <select
              value={simWeather}
              onChange={(e) => setSimWeather(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
            >
              <option value="normal">Normal Mild</option>
              <option value="hot_humid">Hot / Monsoon Humid (+50% Spoilage)</option>
              <option value="cool_dry">Cool Dry Winter (-30% Spoilage)</option>
            </select>
          </div>
        </div>

        {/* Simulation Output Cards & Timeline Matrix */}
        {simResult && (
          <div className="space-y-6 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Immediate Sale Value (Day 0)</div>
                <div className="text-xl font-bold text-slate-900 mt-1">₹{simResult.immediate_revenue.toLocaleString('en-IN')}</div>
                <div className="text-xs text-slate-400 mt-0.5">Rate: ₹{simResult.current_modal_price}/qtl</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs text-emerald-800 font-medium">Max Projected Revenue</div>
                <div className="text-xl font-bold text-emerald-950 mt-1">₹{simResult.max_projected_revenue.toLocaleString('en-IN')}</div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Optimal holding: {simResult.optimal_holding_days} Days ({simResult.expected_gain >= 0 ? `+₹${simResult.expected_gain.toLocaleString('en-IN')}` : `₹${simResult.expected_gain.toLocaleString('en-IN')}`})
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="text-xs text-blue-800 font-medium">Effective Spoilage Rate</div>
                <div className="text-xl font-bold text-blue-950 mt-1">{simResult.effective_daily_spoilage_pct}% / day</div>
                <div className="text-xs text-blue-700 mt-0.5">Adjusted for {simStorage.replace('_', ' ')}</div>
              </div>
            </div>

            {/* Day-by-Day Timeline Table */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Day-by-Day Revenue vs Spoilage Matrix</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3">Timeline</th>
                      <th className="px-4 py-3">Projected Rate</th>
                      <th className="px-4 py-3">Salable Quantity</th>
                      <th className="px-4 py-3">Estimated Spoilage</th>
                      <th className="px-4 py-3">Projected Total Revenue</th>
                      <th className="px-4 py-3 text-right">Net Profit / Loss vs Today</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {simResult.simulation_timeline.map((item) => (
                      <tr key={item.day} className={`hover:bg-slate-50/70 ${item.day === simResult.optimal_holding_days ? 'bg-emerald-50/40 font-semibold' : ''}`}>
                        <td className="px-4 py-3">
                          {item.day === 0 ? 'Day 0 (Today)' : `Day +${item.day}`}
                          {item.day === simResult.optimal_holding_days && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white">Optimal</span>
                          )}
                        </td>
                        <td className="px-4 py-3">₹{item.projected_modal_price_qtl}/qtl</td>
                        <td className="px-4 py-3">{item.salable_quantity_kg.toLocaleString()} kg</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{item.spoilage_loss_kg} kg</td>
                        <td className="px-4 py-3 font-bold text-slate-900">₹{item.projected_revenue.toLocaleString('en-IN')}</td>
                        <td className={`px-4 py-3 text-right font-bold ${item.net_delta_vs_immediate >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {item.net_delta_vs_immediate >= 0 ? `+₹${item.net_delta_vs_immediate.toLocaleString('en-IN')}` : `-₹${Math.abs(item.net_delta_vs_immediate).toLocaleString('en-IN')}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
