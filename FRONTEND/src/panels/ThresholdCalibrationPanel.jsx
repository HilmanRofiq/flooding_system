import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import PanelSkeleton from '../components/PanelSkeleton';

const STATUS_COLORS = {
  AMAN: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', icon: '🟢' },
  WASPADA: { color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', icon: '🟡' },
  SIAGA: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: '🟠' },
  BAHAYA: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '🔴' },
};

export default function ThresholdCalibrationPanel() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSensor, setSavingSensor] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Threshold values
  const [amanMax, setAmanMax] = useState(80);
  const [waspadaMax, setWaspadaMax] = useState(120);
  const [siagaMax, setSiagaMax] = useState(140);

  // Sensor config
  const [sensorHeight, setSensorHeight] = useState(350);
  const [offsetCm, setOffsetCm] = useState(0);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getSettings(token);
      const s = result.data;
      setAmanMax(s.thresholds?.aman_max ?? 80);
      setWaspadaMax(s.thresholds?.waspada_max ?? 120);
      setSiagaMax(s.thresholds?.siaga_max ?? 140);
      setSensorHeight(s.sensorHeight ?? 350);
      setOffsetCm(s.offsetCm ?? 0);
    } catch (err) {
      setError('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const showMessage = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    const a = Number(amanMax), w = Number(waspadaMax), s = Number(siagaMax);

    if (a >= w || w >= s) {
      showMessage('Urutan harus: AMAN < WASPADA < SIAGA', 'error');
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateThresholds(token, {
        aman_max: a, waspada_max: w, siaga_max: s,
      });
      showMessage('Batas ketinggian berhasil disimpan!');
    } catch (err) {
      showMessage(err.message || 'Gagal menyimpan', 'error');
    } finally { setSaving(false); }
  };

  const handleSaveSensorConfig = async (e) => {
    e.preventDefault();
    setSavingSensor(true);
    try {
      await adminApi.updateSensorConfig(token, {
        sensorHeight: Number(sensorHeight),
        offsetCm: Number(offsetCm),
      });
      showMessage('Konfigurasi sensor berhasil disimpan!');
    } catch (err) {
      showMessage(err.message || 'Gagal menyimpan', 'error');
    } finally { setSavingSensor(false); }
  };

  const inputClass = 'w-full px-4 py-3 bg-surface-input border border-border-default rounded-lg text-text-primary text-sm outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15';

  if (loading) {
    return <PanelSkeleton />;
  }

  return (
    <div className="animate-page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">📊 Kalibrasi Ketinggian</h1>
        <p className="text-text-muted mt-1 text-sm">Atur batas ketinggian air untuk status AMAN, WASPADA, SIAGA, dan BAHAYA</p>
      </div>

      {/* Alerts */}
      {success && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-green-bg text-badge-green-text border border-badge-green-border">✅ {success}</div>}
      {error && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-red-bg text-badge-red-text border border-badge-red-border">⚠️ {error}</div>}

      {/* Status Preview */}
      <div className="bg-surface-card border border-border-default rounded-xl p-6 mb-6">
        <h3 className="text-base font-bold text-text-primary mb-4">📋 Preview Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { status: 'AMAN', range: `0 — ${amanMax} cm` },
            { status: 'WASPADA', range: `${Number(amanMax) + 1} — ${waspadaMax} cm` },
            { status: 'SIAGA', range: `${Number(waspadaMax) + 1} — ${siagaMax} cm` },
            { status: 'BAHAYA', range: `> ${siagaMax} cm` },
          ].map(({ status, range }) => {
            const cfg = STATUS_COLORS[status];
            return (
              <div key={status} className="rounded-xl p-4 text-center border" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
                <div className="text-2xl mb-1">{cfg.icon}</div>
                <div className="text-sm font-bold" style={{ color: cfg.color }}>{status}</div>
                <div className="text-xs text-text-muted mt-1">{range}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Threshold Form */}
      <div className="bg-surface-card border border-border-default rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-default">
          <h3 className="text-base font-bold text-text-primary">⚙️ Batas Ketinggian Status</h3>
        </div>
        <form onSubmit={handleSaveThresholds}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                🟢 Batas AMAN (cm)
              </label>
              <input type="number" className={inputClass} value={amanMax} onChange={e => setAmanMax(e.target.value)} min="0" step="1" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                🟡 Batas WASPADA (cm)
              </label>
              <input type="number" className={inputClass} value={waspadaMax} onChange={e => setWaspadaMax(e.target.value)} min="0" step="1" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                🟠 Batas SIAGA (cm)
              </label>
              <input type="number" className={inputClass} value={siagaMax} onChange={e => setSiagaMax(e.target.value)} min="0" step="1" required />
            </div>
          </div>
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-semibold text-white hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(51,120,255,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer">
            {saving ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Simpan Batas Ketinggian'}
          </button>
        </form>
      </div>

      {/* Sensor Config */}
      <div className="bg-surface-card border border-border-default rounded-xl p-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-default">
          <h3 className="text-base font-bold text-text-primary">📏 Konfigurasi Sensor</h3>
        </div>
        <form onSubmit={handleSaveSensorConfig}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                Tinggi Sensor dari Dasar Sungai (cm)
              </label>
              <input type="number" className={inputClass} value={sensorHeight} onChange={e => setSensorHeight(e.target.value)} min="0" step="1" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                Offset Kalibrasi (cm)
              </label>
              <input type="number" className={inputClass} value={offsetCm} onChange={e => setOffsetCm(e.target.value)} step="0.1" />
            </div>
          </div>
          <button type="submit" disabled={savingSensor} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-semibold text-white hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(51,120,255,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer">
            {savingSensor ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Simpan Konfigurasi Sensor'}
          </button>
        </form>
      </div>
    </div>
  );
}
