import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';

export default function StationInfoPanel() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [river, setRiver] = useState('');
  const [location, setLocation] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getSettings(token);
      const info = result.data?.stationInfo || {};
      setName(info.name || '');
      setType(info.type || '');
      setDescription(info.description || '');
      setRiver(info.river || '');
      setLocation(info.location || '');
    } catch (err) {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const showMessage = (msg, msgType = 'success') => {
    if (msgType === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateStationInfo(token, { name, type, description, river, location });
      showMessage('Informasi pos berhasil disimpan!');
    } catch (err) {
      showMessage(err.message || 'Gagal menyimpan', 'error');
    } finally { setSaving(false); }
  };

  const inputClass = 'w-full px-4 py-3 bg-surface-input border border-border-default rounded-lg text-text-primary text-sm outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted text-sm gap-3">
        <div className="w-5 h-5 border-2 border-border-default border-t-blue-500 rounded-full animate-spin" /> Memuat data...
      </div>
    );
  }

  return (
    <div className="animate-page-enter">
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">ℹ️ Informasi Pos</h1>
        <p className="text-text-muted mt-1 text-sm">Atur deskripsi dan informasi pos monitoring yang ditampilkan di homepage</p>
      </div>

      {success && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-green-bg text-badge-green-text border border-badge-green-border">✅ {success}</div>}
      {error && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-red-bg text-badge-red-text border border-badge-red-border">⚠️ {error}</div>}

      <div className="bg-surface-card border border-border-default rounded-xl p-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-default">
          <h3 className="text-base font-bold text-text-primary">📝 Edit Informasi Pos</h3>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Nama Pos</label>
              <input type="text" className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Pos Monitoring Banjir" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Tipe Pos</label>
              <input type="text" className={inputClass} value={type} onChange={e => setType(e.target.value)} placeholder="Pos Tinggi Muka Air (TMA)" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Deskripsi</label>
            <textarea className={`${inputClass} resize-y min-h-[100px]`} value={description} onChange={e => setDescription(e.target.value)} placeholder="Sistem monitoring ketinggian air sungai secara real-time..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Nama Sungai</label>
              <input type="text" className={inputClass} value={river} onChange={e => setRiver(e.target.value)} placeholder="Sungai Citarum" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Lokasi</label>
              <input type="text" className={inputClass} value={location} onChange={e => setLocation(e.target.value)} placeholder="Kab. Bandung, Jawa Barat" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-semibold text-white hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(51,120,255,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer">
            {saving ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Simpan Informasi'}
          </button>
        </form>
      </div>

      {/* Preview */}
      <div className="bg-surface-card border border-border-default rounded-xl p-6 mt-6">
        <h3 className="text-base font-bold text-text-primary mb-4">👁 Preview di Homepage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nama Pos', value: name || '-' },
            { label: 'Tipe Pos', value: type || '-' },
            { label: 'Nama Sungai', value: river || '-' },
            { label: 'Lokasi', value: location || '-' },
          ].map(info => (
            <div key={info.label} className="flex justify-between items-center py-3 border-b border-border-subtle last:border-b-0">
              <span className="text-sm text-text-muted">{info.label}</span>
              <span className="text-sm font-semibold text-text-primary">{info.value}</span>
            </div>
          ))}
          <div className="sm:col-span-2">
            <div className="flex justify-between items-start py-3 border-b border-border-subtle">
              <span className="text-sm text-text-muted">Deskripsi</span>
              <span className="text-sm font-semibold text-text-primary text-right max-w-[60%]">{description || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
