import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  Award,
  Package,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Copy,
  Check,
  Send,
  Sliders
} from 'lucide-react'
import { API_BASE_URL } from '../../lib/api'

export default function BuyerMatches() {
  const [activePerspective, setActivePerspective] = useState('farmer')
  const [selectedLotId, setSelectedLotId] = useState('11111111-1111-1111-1111-111111111111')
  const [selectedBuyerId, setSelectedBuyerId] = useState('b1010101-0000-0000-0000-000000000001')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [minScoreFilter, setMinScoreFilter] = useState(40)
  const [activeTradeModal, setActiveTradeModal] = useState(null)
  const [copied, setCopied] = useState(false)

  const demoLots = [
    { id: '11111111-1111-1111-1111-111111111111', crop_type: 'Tomato', quantity_kg: 1200, grade: 'A', state: 'Andhra Pradesh' },
    { id: '22222222-2222-2222-2222-222222222222', crop_type: 'Wheat', quantity_kg: 6000, grade: 'A', state: 'Madhya Pradesh' },
    { id: '33333333-3333-3333-3333-333333333333', crop_type: 'Onion', quantity_kg: 2500, grade: 'B', state: 'Maharashtra' },
    { id: '44444444-4444-4444-4444-444444444444', crop_type: 'Soybean', quantity_kg: 4000, grade: 'A', state: 'Madhya Pradesh' }
  ]

  const demoBuyers = [
    { id: 'b1010101-0000-0000-0000-000000000001', name: 'Reliance Retail Fresh Sourcing', crop: 'Tomato', qty: 1000 },
    { id: 'b1010101-0000-0000-0000-000000000002', name: 'BigBasket Direct Farm Sourcing', crop: 'Tomato', qty: 500 },
    { id: 'b1010101-0000-0000-0000-000000000003', name: 'AgroCorp Grain Exporters', crop: 'Wheat', qty: 5000 },
    { id: 'b1010101-0000-0000-0000-000000000004', name: 'Kisan Mitra FPO Federation', crop: 'Onion', qty: 2000 }
  ]

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    setFeedback('')
    try {
      const url =
        activePerspective === 'farmer'
          ? `${API_BASE_URL}/api/lots/${selectedLotId}/matches`
          : `${API_BASE_URL}/api/buyers/${selectedBuyerId}/matches`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMatches(Array.isArray(data) ? data : [])
      } else {
        setMatches([])
      }
    } catch {
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [activePerspective, selectedLotId, selectedBuyerId])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const handleUpdateStatus = async (matchId, newStatus) => {
    setUpdatingId(matchId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? { ...m, status: newStatus } : m))
        )
        setFeedback(`Match status marked as "${newStatus}"`)
      }
    } catch {
      // safe fallback
    } finally {
      setUpdatingId(null)
    }
  }

  const selectedLotObj = demoLots.find((l) => l.id === selectedLotId) || demoLots[0]

  const generateTradeMessage = (match) => {
    return `🌾 *AgriSync Farm Trade Inquiry*\n---------------------------\nBuyer: ${match.buyer_name || match.company_name}\nCrop Offered: ${match.crop_type || selectedLotObj.crop_type} (Grade ${selectedLotObj.grade})\nLot Quantity: ${selectedLotObj.quantity_kg.toLocaleString()} kg\nMatch Compatibility: ${match.match_score}%\nLocation: ${selectedLotObj.state}\nContact: +91-9876543210\n---------------------------\nInterested in procurement dispatch? Reply to confirm slot.`
  }

  const handleCopyTrade = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredMatches = matches.filter((m) => (m.match_score || 0) >= minScoreFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buyer & FPO Smart Matching</h1>
          <p className="text-sm text-slate-500 mt-1">
            Weighted similarity algorithm matching harvested lots with active institutional buyer demand + trade slip generator.
          </p>
        </div>

        {/* Perspective Switcher */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
          <button
            onClick={() => setActivePerspective('farmer')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activePerspective === 'farmer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Farmer Perspective
          </button>
          <button
            onClick={() => setActivePerspective('buyer')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activePerspective === 'buyer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buyer Perspective
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-emerald-600 font-bold">×</button>
        </div>
      )}

      {/* Perspective Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {activePerspective === 'farmer' ? (
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Select Farmer Lot to Match Against Buyers
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {demoLots.map((lot) => (
                <button
                  key={lot.id}
                  onClick={() => setSelectedLotId(lot.id)}
                  className={`p-3 text-left rounded-lg border text-sm transition-colors ${
                    selectedLotId === lot.id
                      ? 'border-emerald-600 bg-emerald-50 text-slate-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between">
                    <span>{lot.crop_type}</span>
                    <span className="text-xs text-slate-500">Grade {lot.grade}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{lot.quantity_kg.toLocaleString()} kg · {lot.state}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Select Buyer Demand Profile to Find Lots
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {demoBuyers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBuyerId(b.id)}
                  className={`p-3 text-left rounded-lg border text-sm transition-colors ${
                    selectedBuyerId === b.id
                      ? 'border-emerald-600 bg-emerald-50 text-slate-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate font-medium">{b.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{b.crop} (Min {b.qty} kg)</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Matches Results Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Ranked Matches ({filteredMatches.length})
            </h2>
            <p className="text-xs text-slate-500">
              Scored on crop match (40%), quantity fit (25%), grade fit (20%), and location (15%)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Min Score:</span>
              <select
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(parseInt(e.target.value, 10))}
                className="px-2 py-1 rounded border border-slate-300 bg-white"
              >
                <option value="0">All Matches (0%+)</option>
                <option value="40">Viable (40%+)</option>
                <option value="60">Good Fit (60%+)</option>
                <option value="80">High Match (80%+)</option>
              </select>
            </div>

            <button
              onClick={fetchMatches}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs">Computing weighted similarity scores...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium">No active demand matches found for this selection.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((m) => {
              const score = m.match_score || 0
              const isHigh = score >= 80
              const isMedium = score >= 60 && score < 80

              return (
                <div
                  key={m.id || m.buyer_id || m.lot_id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900">
                        {m.buyer_name || m.company_name || `Lot ${m.lot_id?.substring(0, 8)}`}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isHigh
                            ? 'bg-emerald-100 text-emerald-800'
                            : isMedium
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {score}% Match
                      </span>
                      <span className="text-xs uppercase font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        Status: {m.status || 'suggested'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      {m.crop_type && <span>Crop: <strong className="text-slate-800">{m.crop_type}</strong></span>}
                      {m.min_quantity_kg && <span>Min Demand: {m.min_quantity_kg} kg</span>}
                      {m.quantity_kg && <span>Lot Size: {m.quantity_kg} kg</span>}
                      {m.preferred_grade && <span>Grade Target: {m.preferred_grade}</span>}
                      {m.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {m.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & WhatsApp Trade Slip */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => setActiveTradeModal(m)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Trade Slip
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(m.id, 'interested')}
                      disabled={updatingId === m.id || m.status === 'interested'}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
                    >
                      Interested
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(m.id, 'accepted')}
                      disabled={updatingId === m.id || m.status === 'accepted'}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(m.id, 'rejected')}
                      disabled={updatingId === m.id || m.status === 'rejected'}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Trade Slip Modal */}
      {activeTradeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Instant Trade Slip & Inquiry
              </h3>
              <button
                onClick={() => setActiveTradeModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Copy this pre-filled trade inquiry to send directly to the buyer via WhatsApp or SMS:
            </p>

            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
              {generateTradeMessage(activeTradeModal)}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleCopyTrade(generateTradeMessage(activeTradeModal))}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Trade Slip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
