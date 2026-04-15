import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { devicesApi, sensorDataApi } from '../services/api';

export default function ExportCSVPanel() {
  const { token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [fetchingDevices, setFetchingDevices] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(null);

  const fetchDevices = useCallback(async () => {
    setFetchingDevices(true);
    try {
      const result = await devicesApi.getAll(token);
      setDevices(result.data || []);
    } catch (err) {
      setError('Failed to load devices');
    } finally {
      setFetchingDevices(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const flattenPayload = (payload) => {
    if (typeof payload !== 'object' || payload === null) return { payload: String(payload) };
    const flat = {};
    for (const [key, value] of Object.entries(payload)) flat[`payload_${key}`] = value;
    return flat;
  };

  const handlePreview = async () => {
    if (!selectedDevice) { setError('Please select a device'); return; }
    setLoading(true); setError('');
    try {
      const result = await sensorDataApi.getByDevice(selectedDevice, { limit });
      const data = result.data || [];
      if (data.length === 0) { setError('No data found for this device'); setPreview(null); return; }
      setPreview({ device: result.device, data, total: result.meta.total });
      setSuccess(`Found ${data.length} records (total: ${result.meta.total})`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to fetch data'); setPreview(null);
    } finally { setLoading(false); }
  };

  const handleExport = () => {
    if (!preview || !preview.data.length) return;
    const flatData = preview.data.map(item => ({
      id: item.id, ...flattenPayload(item.payload),
      createdAt: new Date(item.createdAt).toLocaleString('id-ID'),
    }));
    const allKeys = new Set();
    flatData.forEach(row => Object.keys(row).forEach(key => allKeys.add(key)));
    const headers = Array.from(allKeys);
    const escapeCSV = (val) => {
      const str = String(val ?? '');
      return (str.includes(',') || str.includes('"') || str.includes('\n')) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const csvRows = [
      headers.map(escapeCSV).join(','),
      ...flatData.map(row => headers.map(h => escapeCSV(row[h])).join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sensor_data_${preview.device?.name?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccess('CSV exported successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const selectClass = 'w-full px-4 py-2.5 bg-surface-input border border-border-default rounded-lg text-text-primary text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2012%2012%27%3E%3Cpath%20fill=%27%2394a3b8%27%20d=%27M6%208L1%203h10z%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_1rem_center] pr-10 cursor-pointer';

  return (
    <div className="animate-page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">📤 Export to CSV</h1>
        <p className="text-text-muted mt-1 text-sm">Export sensor data from any device as CSV file</p>
      </div>

      {/* Alerts */}
      {success && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-green-bg text-badge-green-text border border-badge-green-border">✅ {success}</div>}
      {error && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-red-bg text-badge-red-text border border-badge-red-border">⚠️ {error}</div>}

      {/* Config Card */}
      <div className="bg-surface-card border border-border-default rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-default">
          <h3 className="text-base font-bold text-text-primary">Export Configuration</h3>
        </div>

        {fetchingDevices ? (
          <div className="flex items-center justify-center py-8 text-text-muted text-sm gap-3">
            <div className="w-5 h-5 border-2 border-border-default border-t-blue-500 rounded-full animate-spin" /> Loading devices...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide" htmlFor="export-device">Select Device</label>
                <select id="export-device" className={selectClass} value={selectedDevice} onChange={(e) => { setSelectedDevice(e.target.value); setPreview(null); }}>
                  <option value="">-- Choose a device --</option>
                  {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide" htmlFor="export-limit">Data Limit</label>
                <select id="export-limit" className={selectClass} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                  {[50, 100, 250, 500, 1000].map(n => <option key={n} value={n}>{n} records</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handlePreview} disabled={loading || !selectedDevice} id="preview-btn" className="px-5 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm font-semibold text-text-primary hover:bg-surface-card-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-border-default border-t-blue-500 rounded-full animate-spin" /> Loading...</> : '👁 Preview Data'}
              </button>
              {preview && preview.data.length > 0 && (
                <button onClick={handleExport} id="export-btn" className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 rounded-lg text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                  📥 Download CSV
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-surface-card border border-border-default rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-default">
            <h3 className="text-base font-bold text-text-primary">📋 Data Preview — {preview.device?.name}</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-badge-cyan-bg text-badge-cyan-text border border-badge-cyan-border">
              Showing {preview.data.length} of {preview.total}
            </span>
          </div>

          {preview.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-5xl mb-4 opacity-30">📭</div>
              <div className="text-lg font-semibold text-text-secondary">No data available</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border-default max-h-[400px] overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-surface-elevated sticky top-0">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">ID</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Payload</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.data.slice(0, 20).map((item) => (
                    <tr key={item.id} className="transition-colors duration-150 hover:bg-badge-blue-bg border-b border-border-subtle last:border-b-0">
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-badge-blue-bg text-badge-blue-text border border-badge-blue-border">#{item.id}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="bg-surface-input border border-border-default rounded-lg px-3 py-2 font-mono text-xs text-accent-cyan overflow-x-auto whitespace-pre-wrap break-all max-h-[120px] overflow-y-auto">
                          {JSON.stringify(item.payload, null, 2)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-text-muted">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.data.length > 20 && (
            <div className="text-center text-text-muted text-sm mt-4">
              Showing first 20 rows of {preview.data.length} total. Full data will be in the CSV export.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
