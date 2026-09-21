import { API_BASE_URL, SOCKET_URL } from '../../lib/api';
import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, PlayCircle, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

const INITIAL_TOKENS = [
  {
    id: 'book-001',
    token: '#B-14',
    farmer: 'Rajesh Tukaram Patil',
    lot: 'LOT-2024-098',
    vehicle: 'MH-15-EG-4412',
    driver: 'Dattatray Shinde',
    crop: 'Red Onion (24.0 MT)',
    queue_position: 1,
    gate: 'Gate #2 Entry',
    status: 'in_progress', // 'waiting' | 'in_progress' | 'completed'
    wait: 'In Yard Scale',
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'book-002',
    token: '#B-15',
    farmer: 'Suresh Ananda More',
    lot: 'LOT-2024-102',
    vehicle: 'MH-15-BJ-9182',
    driver: 'Sanjay More',
    crop: 'Soybean (12.5 MT)',
    queue_position: 2,
    gate: 'Gate #1 Entry',
    status: 'waiting',
    wait: '~12 mins',
    updatedAt: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'book-003',
    token: '#B-16',
    farmer: 'Dinesh Balu Pawar',
    lot: 'LOT-2024-105',
    vehicle: 'MH-15-CL-3390',
    driver: 'Kishan Logistics',
    crop: 'Tomato (8.0 MT)',
    queue_position: 3,
    gate: 'Gate #2 Entry',
    status: 'waiting',
    wait: '~35 mins',
    updatedAt: new Date(Date.now() - 1000 * 60 * 42).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'book-000',
    token: '#B-13',
    farmer: 'Bhaskar Rao Kadam',
    lot: 'LOT-2024-091',
    vehicle: 'MH-15-AK-2041',
    driver: 'Bhaskar Kadam',
    crop: 'Wheat (18.0 MT)',
    queue_position: 0,
    gate: 'Gate #1 Entry',
    status: 'completed',
    wait: 'Departed',
    updatedAt: new Date(Date.now() - 1000 * 60 * 65).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const LOCAL_STORAGE_KEY = 'agrisync_mandi_fifo_tokens_v2';

export const LiveQueue = () => {
  const [tokens, setTokens] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TOKENS;
  });

  const [filterStatus, setFilterStatus] = useState('active');
  const [advancingId, setAdvancingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDemoState, setIsDemoState] = useState(true);

  // Check RBAC role
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('agrisync_user') || '{}');
    } catch {
      return {};
    }
  })();
  const userRole = currentUser?.role || 'farmer';
  const isOperator = userRole === 'apmc' || userRole === 'admin' || userRole === 'procurement_operator';

  // Save changes locally
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tokens));
    } catch {}
  }, [tokens]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // State progression: waiting -> in_progress -> completed
  const handleAdvance = async (tokenId) => {
    if (!isOperator) {
      showToast('Action Denied: Only APMC Procurement Operators have queue advancement authority.', 'error');
      return;
    }

    const currentToken = tokens.find((t) => t.id === tokenId);
    if (!currentToken) return;

    let nextStatus = null;
    if (currentToken.status === 'waiting') {
      nextStatus = 'in_progress';
    } else if (currentToken.status === 'in_progress') {
      nextStatus = 'completed';
    } else {
      return; // Already completed
    }

    setAdvancingId(tokenId);

    try {
      // 1. Try existing backend endpoint: PATCH /api/bookings/:id/advance
      const backendUrl = API_BASE_URL;
      const tokenAuth = localStorage.getItem('agrisync_token');

      const res = await fetch(`${backendUrl}/api/bookings/${tokenId}/advance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenAuth ? { Authorization: `Bearer ${tokenAuth}` } : {})
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        setIsDemoState(false);
        setTokens((prev) =>
          prev.map((t) =>
            t.id === tokenId
              ? {
                  ...t,
                  status: nextStatus,
                  wait: nextStatus === 'in_progress' ? 'In Yard Scale' : 'Departed',
                  updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              : t
          )
        );
        showToast(`Token ${currentToken.token} successfully advanced to ${nextStatus.toUpperCase()} on Mandi Terminal.`);
      } else {
        // Fallback to local progression and label as demo state
        setIsDemoState(true);
        setTokens((prev) =>
          prev.map((t) =>
            t.id === tokenId
              ? {
                  ...t,
                  status: nextStatus,
                  wait: nextStatus === 'in_progress' ? 'In Yard Scale' : 'Departed',
                  updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              : t
          )
        );
        showToast(`Token ${currentToken.token} advanced to ${nextStatus.toUpperCase()} (Simulated Local State).`);
      }
    } catch {
      // Network/local fallback
      setIsDemoState(true);
      setTokens((prev) =>
        prev.map((t) =>
          t.id === tokenId
            ? {
                ...t,
                status: nextStatus,
                wait: nextStatus === 'in_progress' ? 'In Yard Scale' : 'Departed',
                updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            : t
        )
      );
      showToast(`Token ${currentToken.token} advanced to ${nextStatus.toUpperCase()} (Simulated Local State).`);
    } finally {
      setAdvancingId(null);
    }
  };

  const resetDemoQueue = () => {
    setTokens(INITIAL_TOKENS);
    setIsDemoState(true);
    showToast('FIFO Queue reset to baseline demonstration state.');
  };

  const inProgressToken = tokens.find((t) => t.status === 'in_progress');
  const nextWaitingToken = tokens
    .filter((t) => t.status === 'waiting')
    .sort((a, b) => a.queue_position - b.queue_position)[0];

  const filteredTokens = tokens.filter((t) => {
    if (filterStatus === 'active') return t.status === 'in_progress' || t.status === 'waiting';
    if (filterStatus === 'waiting') return t.status === 'waiting';
    if (filterStatus === 'in_progress') return t.status === 'in_progress';
    if (filterStatus === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border transition-all ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 font-black">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">APMC Yard Operations</span>
            {isDemoState && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                DEMO / SIMULATED FIFO STATE
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-[#0f172a]">Live Mandi Procurement Queue</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Strict First-In First-Out (FIFO) unloader sequence synchronized across gate, weighbridge & assay.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetDemoQueue}
            title="Reset to default demo queue"
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={13} /> Reset Queue
          </button>
          <div className="px-3.5 py-2 bg-[#0f172a] text-white rounded-xl text-xs font-bold shadow-xs">
            Pimpalgaon Yard • Active: {tokens.filter((t) => t.status !== 'completed').length}
          </div>
        </div>
      </div>

      {/* RBAC Operator Banner */}
      {!isOperator && (
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-slate-500" />
            <span>
              Logged in as <strong className="capitalize">{userRole}</strong>. Operator queue advancement is locked to APMC Yard Supervisors.
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-1 rounded border border-slate-200">
            Read-Only Monitor
          </span>
        </div>
      )}

      {/* Yard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Currently Processing</div>
          <div className="text-2xl font-black text-[#047857] mt-1 font-data-tabular">
            {inProgressToken ? inProgressToken.token : 'None in Scale'}
          </div>
          <div className="text-xs text-slate-700 font-bold mt-1">
            {inProgressToken ? `${inProgressToken.driver} (${inProgressToken.crop})` : 'Weighbridge Available'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Next In Line</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1 font-data-tabular">
            {nextWaitingToken ? nextWaitingToken.token : 'Queue Clear'}
          </div>
          <div className="text-xs text-slate-700 font-bold mt-1">
            {nextWaitingToken ? `${nextWaitingToken.gate} • ${nextWaitingToken.vehicle}` : 'Ready for bookings'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold uppercase">Avg Processing Speed</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1 font-data-tabular">4.5 Min / Truck</div>
          <div className="text-xs text-[#15803d] font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 size={13} /> Zero Bottleneck Enforced
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'active', label: 'Active Queue (In-Yard & Waiting)' },
          { id: 'waiting', label: 'Waiting at Gate' },
          { id: 'in_progress', label: 'In Progress (Weighbridge / Assay)' },
          { id: 'completed', label: 'Completed Deliveries' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              filterStatus === tab.id
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {filteredTokens.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium text-xs">
            No vehicles found in this queue segment.
          </div>
        ) : (
          filteredTokens.map((row) => {
            const isWaiting = row.status === 'waiting';
            const isInProgress = row.status === 'in_progress';
            const isCompleted = row.status === 'completed';

            return (
              <div key={row.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center font-data-tabular">
                      #{row.queue_position || '—'}
                    </span>
                    <span className="font-black text-[#047857] font-data-tabular text-sm">{row.token}</span>
                  </div>
                  <div>
                    {isWaiting && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase">
                        <Clock size={10} /> WAITING
                      </span>
                    )}
                    {isInProgress && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black uppercase">
                        <PlayCircle size={10} /> IN PROGRESS
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase">
                        <CheckCircle2 size={10} /> COMPLETED
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Farmer:</span>
                    <span className="font-bold text-slate-900">{row.farmer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lot & Commodity:</span>
                    <span className="font-semibold text-slate-800">{row.crop} <span className="text-slate-400 font-mono text-[10px]">({row.lot})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle / Driver:</span>
                    <span className="text-slate-700 font-mono font-bold">{row.vehicle} <span className="font-sans font-normal text-slate-500">({row.driver})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gate / Est. Wait:</span>
                    <span className="font-bold text-[#0f172a]">{row.gate} • {row.wait}</span>
                  </div>
                </div>

                {isOperator && (
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    {isWaiting && (
                      <button
                        onClick={() => handleAdvance(row.id)}
                        disabled={advancingId === row.id}
                        className="w-full py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <span>ADVANCE QUEUE</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                    {isInProgress && (
                      <button
                        onClick={() => handleAdvance(row.id)}
                        disabled={advancingId === row.id}
                        className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <span>COMPLETE DELIVERIES</span>
                        <CheckCircle2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-[#dcfce7] text-[11px] font-extrabold uppercase tracking-wider">
                <th className="p-4">Queue Pos. & Token</th>
                <th className="p-4">Farmer & Lot ID</th>
                <th className="p-4">Vehicle & Driver</th>
                <th className="p-4">Harvest Commodity</th>
                <th className="p-4">Mandi Gate</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Est. Wait</th>
                {isOperator && <th className="p-4 text-right pr-6">Operator Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-[#0f172a]">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={isOperator ? 8 : 7} className="p-8 text-center text-slate-500 font-medium">
                    No vehicles found in this queue segment.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((row) => {
                  const isWaiting = row.status === 'waiting';
                  const isInProgress = row.status === 'in_progress';
                  const isCompleted = row.status === 'completed';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50 font-medium transition-colors">
                      {/* Queue Pos & Token */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center font-data-tabular">
                            #{row.queue_position || '—'}
                          </span>
                          <span className="font-black text-[#047857] font-data-tabular text-sm">{row.token}</span>
                        </div>
                      </td>

                      {/* Farmer & Lot */}
                      <td className="p-4">
                        <div className="font-bold text-[#0f172a]">{row.farmer}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{row.lot}</div>
                      </td>

                      {/* Vehicle & Driver */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-[#0f172a]">{row.vehicle}</div>
                        <div className="text-[11px] text-slate-500">{row.driver}</div>
                      </td>

                      {/* Commodity */}
                      <td className="p-4 font-semibold text-slate-800">{row.crop}</td>

                      {/* Gate */}
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {row.gate}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {isWaiting && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase">
                            <Clock size={11} /> WAITING AT GATE
                          </span>
                        )}
                        {isInProgress && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black uppercase">
                            <PlayCircle size={11} /> IN PROGRESS
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase">
                            <CheckCircle2 size={11} /> COMPLETED
                          </span>
                        )}
                      </td>

                      {/* Est Wait */}
                      <td className="p-4 font-bold text-[#0f172a] font-data-tabular">{row.wait}</td>

                      {/* Operator Action */}
                      {isOperator && (
                        <td className="p-4 text-right pr-6">
                          {isWaiting && (
                            <button
                              onClick={() => handleAdvance(row.id)}
                              disabled={advancingId === row.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white rounded-lg text-xs font-black transition-all shadow-2xs active:scale-98 cursor-pointer disabled:opacity-50"
                            >
                              <span>ADVANCE QUEUE</span>
                              <ArrowRight size={13} />
                            </button>
                          )}
                          {isInProgress && (
                            <button
                              onClick={() => handleAdvance(row.id)}
                              disabled={advancingId === row.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-black transition-all shadow-2xs active:scale-98 cursor-pointer disabled:opacity-50"
                            >
                              <span>COMPLETE</span>
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          {isCompleted && (
                            <span className="text-[11px] font-bold text-slate-400">Terminal Cleared</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiveQueue;
