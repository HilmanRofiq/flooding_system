import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';

const FIXED_ZOOM = 13;

export default function MapSettingsPanel() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [lat, setLat] = useState(-6.9175);
  const [lng, setLng] = useState(107.6191);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getSettings(token);
      const coords = result.data?.mapCoordinates || {};
      setLat(coords.lat ?? -6.9175);
      setLng(coords.lng ?? 107.6191);
    } catch (err) {
      setError('Gagal memuat data');
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateMapCoordinates(token, {
        lat: Number(lat), lng: Number(lng), zoom: FIXED_ZOOM,
      });
      showMessage('Koordinat peta berhasil disimpan!');
    } catch (err) {
      showMessage(err.message || 'Gagal menyimpan', 'error');
    } finally { setSaving(false); }
  };

  const inputClass = 'w-full px-4 py-3 bg-surface-input border border-border-default rounded-lg text-text-primary text-sm outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15';

  // Generate OpenStreetMap embed URL (fixed zoom)
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.015},${lng + 0.02},${lat + 0.015}&layer=mapnik&marker=${lat},${lng}`;

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
        <h1 className="text-[1.75rem] font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">🗺️ Pengaturan Peta</h1>
        <p className="text-text-muted mt-1 text-sm">Atur koordinat dan zoom level peta OpenStreetMap di footer homepage</p>
      </div>

      {success && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-green-bg text-badge-green-text border border-badge-green-border">✅ {success}</div>}
      {error && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-red-bg text-badge-red-text border border-badge-red-border">⚠️ {error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Card */}
        <div className="bg-surface-card border border-border-default rounded-xl p-6">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-default">
            <h3 className="text-base font-bold text-text-primary">📍 Koordinat Lokasi</h3>
          </div>

          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Latitude</label>
                <input type="number" step="0.000001" className={inputClass} value={lat} onChange={e => setLat(e.target.value)} required />
                <p className="text-xs text-text-dim mt-1">-90 sampai 90</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Longitude</label>
                <input type="number" step="0.000001" className={inputClass} value={lng} onChange={e => setLng(e.target.value)} required />
                <p className="text-xs text-text-dim mt-1">-180 sampai 180</p>
              </div>
            </div>
            <div className="px-4 py-3 rounded-lg text-sm bg-badge-blue-bg text-badge-blue-text border border-badge-blue-border mb-5">
              💡 <strong>Tip:</strong> Gunakan Google Maps untuk mendapatkan koordinat. Klik kanan pada lokasi → "What's here?" untuk melihat lat/lng.
            </div>

            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-semibold text-white hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(51,120,255,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer">
              {saving ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Menyimpan...</> : '💾 Simpan Koordinat'}
            </button>
          </form>
        </div>

        {/* Map Preview */}
        <div className="bg-surface-card border border-border-default rounded-xl p-6">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-default">
            <h3 className="text-base font-bold text-text-primary">👁 Preview Peta</h3>
          </div>
          <div className="rounded-xl overflow-hidden border border-border-default" style={{ height: '350px' }}>
            <iframe
              title="Map Preview"
              width="100%"
              height="100%"
              src={mapUrl}
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
          <p className="text-xs text-text-dim mt-3 text-center">
            Lat: {lat}, Lng: {lng}
          </p>
        </div>
      </div>
    </div>
  );
}
