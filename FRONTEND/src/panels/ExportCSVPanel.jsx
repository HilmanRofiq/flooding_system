import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';

export default function ExportCSVPanel() {
  const { token } = useAuth();
  const [limit, setLimit] = useState(500);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(null);

  const showMessage = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const handlePreview = async () => {
    setLoading(true); setError('');
    try {
      const params = { limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await adminApi.getSensorData(token, params);
      const data = result.data || [];
      if (data.length === 0) { showMessage('Tidak ada data untuk periode ini', 'error'); setPreview(null); return; }
      setPreview({ data, total: result.meta?.total || data.length });
      showMessage(`Ditemukan ${data.length} data (total: ${result.meta?.total || data.length})`);
    } catch (err) {
      showMessage(err.message || 'Gagal memuat data', 'error'); setPreview(null);
    } finally { setLoading(false); }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = { limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await adminApi.exportCSV(token, params);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sensor_data_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showMessage('CSV berhasil diunduh!');
    } catch (err) {
      showMessage(err.message || 'Gagal export CSV', 'error');
    } finally { setLoading(false); }
  };

  const selectClass = 'w-full px-4 py-2.5 bg-surface-input border border-border-default rounded-lg text-text-primary text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2012%2012%27%3E%3Cpath%20fill=%27%2394a3b8%27%20d=%27M6%208L1%203h10z%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_1rem_center] pr-10 cursor-pointer';
  const inputClass = 'w-full px-4 py-2.5 bg-surface-input border border-border-default rounded-lg text-text-primary text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15';

  return (
    <div className="animate-page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">📤 Export ke CSV</h1>
        <p className="text-text-muted mt-1 text-sm">Export data sensor monitoring banjir ke file CSV</p>
      </div>

      {/* Alerts */}
      {success && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-green-bg text-badge-green-text border border-badge-green-border">✅ {success}</div>}
      {error && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-red-bg text-badge-red-text border border-badge-red-border">⚠️ {error}</div>}

      {/* Config Card */}
      <div className="bg-surface-card border border-border-default rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-default">
          <h3 className="text-base font-bold text-text-primary">⚙️ Pengaturan Export</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide" htmlFor="export-limit">Batas Data</label>
            <select id="export-limit" className={selectClass} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {[100, 250, 500, 1000, 2000, 5000].map(n => <option key={n} value={n}>{n} data</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide" htmlFor="export-start">Tanggal Mulai</label>
            <input id="export-start" type="datetime-local" className={inputClass} value={startDate} onChange={(e) => { setStartDate(e.target.value); setPreview(null); }} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide" htmlFor="export-end">Tanggal Akhir</label>
            <input id="export-end" type="datetime-local" className={inputClass} value={endDate} onChange={(e) => { setEndDate(e.target.value); setPreview(null); }} />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button onClick={handlePreview} disabled={loading} id="preview-btn" className="px-5 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm font-semibold text-text-primary hover:bg-surface-card-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer">
            {loading ? <><div className="w-4 h-4 border-2 border-border-default border-t-blue-500 rounded-full animate-spin" /> Memuat...</> : '👁 Preview Data'}
          </button>
          <button onClick={handleExport} disabled={loading} id="export-btn" className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 rounded-lg text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer">
            📥 Download CSV
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-surface-card border border-border-default rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-default">
            <h3 className="text-base font-bold text-text-primary">📋 Preview Data</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-badge-cyan-bg text-badge-cyan-text border border-badge-cyan-border">
              {preview.data.length} dari {preview.total}
            </span>
          </div>

          {preview.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-5xl mb-4 opacity-30">📭</div>
              <div className="text-lg font-semibold text-text-secondary">Tidak ada data</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border-default max-h-[400px] overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-surface-elevated sticky top-0">
                  <tr>
                    {['No', 'Waktu', 'Device', 'Jarak (cm)', 'TMA (cm)', 'Tanah', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.data.slice(0, 25).map((item, idx) => (
                    <tr key={item._id || idx} className="transition-colors duration-150 hover:bg-badge-blue-bg border-b border-border-subtle last:border-b-0">
                      <td className="px-4 py-3 text-xs text-text-muted">{idx + 1}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{formatDate(item.waktu)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-text-primary">{item.device_id || '-'}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-text-secondary">
                        {item.distance_cm != null ? Number(item.distance_cm).toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-text-primary">
                        {item.water_level != null ? Number(item.water_level).toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-text-secondary">
                        {item.soil_raw != null ? item.soil_raw : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                          item.status === 'AMAN' ? 'bg-badge-green-bg text-badge-green-text border-badge-green-border' :
                          item.status === 'WASPADA' ? 'bg-badge-amber-bg text-badge-amber-text border-badge-amber-border' :
                          item.status === 'SIAGA' ? 'bg-badge-amber-bg text-badge-amber-text border-badge-amber-border' :
                          item.status === 'BAHAYA' ? 'bg-badge-red-bg text-badge-red-text border-badge-red-border' :
                          'bg-badge-blue-bg text-badge-blue-text border-badge-blue-border'
                        }`}>
                          {item.status || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.data.length > 25 && (
            <div className="text-center text-text-muted text-sm mt-4">
              Menampilkan 25 data pertama dari {preview.data.length}. Semua data akan ada di file CSV.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
