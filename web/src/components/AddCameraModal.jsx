import { API_BASE_URL, SOCKET_URL } from '../lib/api';
import { useState, useEffect } from 'react'
import { X, Camera, MapPin, Video, Building, AlertCircle, ShieldCheck, RefreshCw, Eye, EyeOff, Radio, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AddCameraModal({ isOpen, onClose, onCameraAdded, onCameraUpdated, cameraToEdit = null, farms = [] }) {
  const { session } = useAuth()
  const isEditing = Boolean(cameraToEdit && cameraToEdit.id)

  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    port: '554',
    camera_type: 'RTSP',
    purpose: 'Perimeter Camera',
    source_url: '',
    username: '',
    password: '',
    farm_id: '',
    field_id: '',
    zone: '',
    status: true,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (cameraToEdit) {
      setFormData({
        name: cameraToEdit.name || '',
        ip: cameraToEdit.ip || '',
        port: cameraToEdit.port || '554',
        camera_type: cameraToEdit.camera_type || 'RTSP',
        purpose: cameraToEdit.purpose || 'Perimeter Camera',
        source_url: cameraToEdit.source_url || '',
        username: cameraToEdit.username || '',
        password: '',
        farm_id: cameraToEdit.farm_id || (farms[0]?.id || ''),
        field_id: cameraToEdit.field_id || (farms[0]?.id || ''),
        zone: cameraToEdit.zone || '',
        status: cameraToEdit.status === 'online' || cameraToEdit.status === true,
      })
      setTestResult(null)
      setError('')
    } else {
      setFormData({
        name: '',
        ip: '192.168.1.105',
        port: '554',
        camera_type: 'RTSP',
        purpose: 'Perimeter Camera',
        source_url: 'rtsp://192.168.1.105:554/live/ch0',
        username: '',
        password: '',
        farm_id: farms[0]?.id || '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
        field_id: farms[0]?.id || '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
        zone: 'North Field - Onion Plot',
        status: true,
      })
      setTestResult(null)
      setError('')
    }
  }, [cameraToEdit, farms, isOpen])

  if (!isOpen) return null

  const backendUrl = API_BASE_URL;

  // Auto-fill source URL when IP/Port/Type change
  const handleIpChange = (newIp) => {
    let cleanIp = newIp.trim().replace(/^https?:\/\//, '');
    let customPort = formData.port;
    if (cleanIp.includes(':')) {
      const parts = cleanIp.split(':');
      cleanIp = parts[0];
      customPort = parts[1].split('/')[0] || customPort;
    }

    setFormData((prev) => {
      const effectivePort = customPort || (prev.camera_type === 'RTSP' ? '554' : prev.camera_type === 'HTTP_MJPEG' ? '8080' : '80');
      const updated = { ...prev, ip: cleanIp, port: effectivePort };
      if (prev.camera_type === 'RTSP') {
        updated.source_url = `rtsp://${cleanIp || '192.168.1.105'}:${effectivePort}/live/ch0`;
      } else if (prev.camera_type === 'HTTP_SNAPSHOT') {
        updated.source_url = `http://${cleanIp || '192.168.1.105'}:${effectivePort}/snapshot.jpg`;
      } else if (prev.camera_type === 'HTTP_MJPEG') {
        updated.source_url = `http://${cleanIp || '192.168.1.105'}:${effectivePort}/video`;
      }
      return updated;
    });
  };

  const handleTypeChange = (newType) => {
    setFormData((prev) => {
      const defaultPort = newType === 'RTSP' ? '554' : newType === 'HTTP_MJPEG' ? '8080' : '80';
      const updated = { ...prev, camera_type: newType, port: defaultPort };
      if (newType === 'RTSP') {
        updated.source_url = `rtsp://${prev.ip || '192.168.1.105'}:${defaultPort}/live/ch0`;
      } else if (newType === 'HTTP_SNAPSHOT') {
        updated.source_url = `http://${prev.ip || '192.168.1.105'}:${defaultPort}/snapshot.jpg`;
      } else if (newType === 'HTTP_MJPEG') {
        updated.source_url = `http://${prev.ip || '192.168.1.105'}:${defaultPort}/video`;
      }
      return updated;
    });
  };

  const handleTestConnection = async () => {
    setError('')
    setTesting(true)
    setTestResult(null)

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch(`${backendUrl}/api/cameras/test`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ip: formData.ip,
          port: formData.port,
          source_url: formData.source_url,
          camera_type: formData.camera_type,
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult(data)
      } else {
        setTestResult({
          success: false,
          message: data.message || data.error || 'Connection timed out or failed',
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Could not reach server to test camera.',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Camera Name is required')
      return
    }

    setLoading(true)

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const endpoint = isEditing ? `${backendUrl}/api/cameras/${cameraToEdit.id}` : `${backendUrl}/api/cameras`
      const method = isEditing ? 'PUT' : 'POST'

      let finalSourceUrl = formData.source_url.trim();
      if (finalSourceUrl.startsWith('http') && (formData.camera_type === 'HTTP_MJPEG' || finalSourceUrl.includes(':8080')) && !finalSourceUrl.includes('/video') && !finalSourceUrl.includes('/shot.jpg') && !finalSourceUrl.includes('.jpg')) {
        finalSourceUrl = finalSourceUrl.replace(/\/+$/, '') + '/video';
      }

      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify({
          name: formData.name.trim(),
          ip: formData.ip.trim(),
          port: formData.port ? parseInt(formData.port, 10) : (formData.camera_type === 'HTTP_MJPEG' ? 8080 : 554),
          source_url: finalSourceUrl,
          camera_type: formData.camera_type,
          purpose: formData.purpose,
          farm_id: formData.farm_id,
          field_id: formData.field_id,
          zone: formData.zone.trim() || 'General Zone',
          username: formData.username.trim() || undefined,
          password: formData.password || undefined,
          status: formData.status,
          skip_test: false,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const resultCamera = data.data || data.camera

        if (isEditing && onCameraUpdated) {
          onCameraUpdated(resultCamera)
        } else if (onCameraAdded) {
          onCameraAdded(resultCamera)
        }
        onClose()
      } else {
        setError(data?.error || data?.message || 'Failed to save camera')
      }
    } catch (err) {
      setError('Network error. Failed to save camera.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-[#E5E7EB] my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#FAFBF8] shrink-0">
          <div className="flex items-center gap-2 text-[#2F2F2F]">
            <div className="p-2 rounded-lg bg-[#047857]/10 text-[#047857]">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="font-black text-base text-[#0f172a] tracking-tight">
                {isEditing ? 'Edit IP Camera Configuration' : 'Add New IP Web Camera'}
              </h2>
              <p className="text-xs text-[#666666]">Configure RTSP / HTTP stream, IP, and field assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#666666] hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Camera Name & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2F2F2F] mb-1">
                Camera Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Field Camera 01"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold focus:outline-hidden focus:border-[#047857]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#2F2F2F] mb-1">
                Camera Purpose
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold bg-white focus:outline-hidden focus:border-[#047857]"
              >
                <option value="Perimeter Camera">Perimeter Camera</option>
                <option value="Field Camera">Field Camera</option>
                <option value="Animal Monitoring Camera">Animal Monitoring Camera</option>
              </select>
            </div>
          </div>

          {/* IP Address & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-[#2F2F2F] mb-1">
                Camera IP Address / Host
              </label>
              <input
                type="text"
                placeholder="192.168.1.105"
                value={formData.ip}
                onChange={(e) => handleIpChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-xs font-mono focus:outline-hidden focus:border-[#047857]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#2F2F2F] mb-1">
                Port
              </label>
              <input
                type="number"
                placeholder="554"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-xs font-mono focus:outline-hidden focus:border-[#047857]"
              />
            </div>
          </div>

          {/* Protocol Type */}
          <div>
            <label className="block font-bold text-[#2F2F2F] mb-1">
              Stream Protocol
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['RTSP', 'HTTP_MJPEG', 'HTTP_SNAPSHOT', 'SIMULATED'].map((proto) => (
                <button
                  type="button"
                  key={proto}
                  onClick={() => handleTypeChange(proto)}
                  className={`py-1.5 px-2 rounded-lg font-extrabold text-[10px] border transition-all cursor-pointer ${
                    formData.camera_type === proto
                      ? 'bg-[#047857] text-white border-[#047857] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {proto}
                </button>
              ))}
            </div>
          </div>

          {/* Full Stream URL */}
          <div>
            <label className="block font-bold text-[#2F2F2F] mb-1 flex items-center justify-between">
              <span>Stream / RTSP URL</span>
              <span className="text-[10px] text-slate-400 font-normal">Auto-generated or custom</span>
            </label>
            <input
              type="text"
              placeholder="rtsp://192.168.1.105:554/live/ch0"
              value={formData.source_url}
              onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-xs font-mono focus:outline-hidden focus:border-[#047857]"
            />
          </div>

          {/* Authentication Credentials */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                Camera Username
              </label>
              <input
                type="text"
                placeholder="admin (optional)"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-hidden focus:border-[#047857]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                Camera Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="•••••••• (optional)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-hidden focus:border-[#047857] pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Farm & Zone Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2F2F2F] mb-1">
                Associated Farm
              </label>
              <select
                value={formData.farm_id}
                onChange={(e) => setFormData({ ...formData, farm_id: e.target.value, field_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold bg-white focus:outline-hidden focus:border-[#047857]"
              >
                {farms.length > 0 ? (
                  farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || 'Rajesh Farm (Niphad)'}
                    </option>
                  ))
                ) : (
                  <option value="29b9b72f-0d43-4a23-9b04-dc9e14180f2a">AgriSync Main Farm (Niphad)</option>
                )}
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#2F2F2F] mb-1">
                Field Zone / Location
              </label>
              <input
                type="text"
                placeholder="e.g. North Field - Onion Plot"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold focus:outline-hidden focus:border-[#047857]"
              />
            </div>
          </div>

          {/* Live Stream Test Result Box */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 text-xs">Connection & Frame Verification</span>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-extrabold cursor-pointer transition-all active:scale-95 disabled:opacity-60"
              >
                <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{testResult.message}</p>
                  {testResult.latencyMs && (
                    <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                      Latency: {testResult.latencyMs}ms • Status: ONLINE • Verified Frame Ready
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAFBF8] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D1D5DB] bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading && <RefreshCw size={14} className="animate-spin" />}
            <span>{isEditing ? 'Save Camera Settings' : 'Save & Start Monitoring'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
