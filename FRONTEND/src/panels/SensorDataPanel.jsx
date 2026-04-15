import { useState, useEffect, useCallback } from 'react';
import { sensorDataApi } from '../services/api';

export default function SensorDataPanel() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({ total: 0 });
  const [error, setError] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);

  const fetchAllDevicesData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await sensorDataApi.getAll({ limit });
      setDevices(result.devices || []);
      setSensorData(result.data || []);
      setMeta(result.meta || { total: 0 });
      setDeviceInfo(null);
    } catch (err) {
      setError('Failed to load sensor data');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const fetchDeviceData = useCallback(async () => {
    if (!selectedDevice) {
      fetchAllDevicesData();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await sensorDataApi.getByDevice(selectedDevice, { limit });
      setSensorData(result.data || []);
      setMeta(result.meta || { total: 0 });
      setDeviceInfo(result.device || null);
    } catch (err) {
      setError(err.message || 'Failed to load device data');
      setSensorData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, limit, fetchAllDevicesData]);

  useEffect(() => {
    fetchDeviceData();
  }, [fetchDeviceData]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const renderPayload = (payload) => {
    if (typeof payload === 'object') {
      return Object.entries(payload).map(([key, val]) => (
        <span key={key} className="mr-4">
          <span className="text-slate-500">{key}:</span>{' '}
          <span className="text-cyan-300 font-semibold">{String(val)}</span>
        </span>
      ));
    }
    return JSON.stringify(payload);
  };

  const selectClass =
    'px-4 py-2.5 bg-surface-input border border-border-default rounded-lg text-slate-100 text-sm outline-none transition-all duration-150 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2012%2012%27%3E%3Cpath%20fill=%27%2394a3b8%27%20d=%27M6%208L1%203h10z%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_1rem_center] pr-10 cursor-pointer';

  return (
    <div className="animate-page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-extrabold bg-gradient-to-r from-slate-100 to-blue-300 bg-clip-text text-transparent">
          📊 Sensor Data
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Monitor real-time sensor readings from your devices</p>
      </div>

      {/* Controls */}
      <div className="flex items-end gap-4 mb-6 flex-wrap max-md:flex-col max-md:items-stretch">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Device</label>
          <select
            className={selectClass}
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            id="device-select"
          >
            <option value="">All Devices</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Data Limit</label>
          <select
            className={selectClass}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            id="limit-select"
          >
            <option value={10}>10 data</option>
            <option value={25}>25 data</option>
            <option value={50}>50 data</option>
            <option value={100}>100 data</option>
            <option value={250}>250 data</option>
            <option value={500}>500 data</option>
          </select>
        </div>

        <button
          onClick={fetchDeviceData}
          id="refresh-btn"
          className="px-4 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-slate-100 text-sm font-semibold hover:bg-surface-card-hover hover:border-border-hover transition-all duration-150"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Device Info Banner */}
      {deviceInfo && selectedDevice && (
        <div className="bg-surface-card border border-white/5 border-l-[3px] border-l-blue-500 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="text-base font-bold text-slate-100">{deviceInfo.name}</h3>
              {deviceInfo.description && (
                <p className="text-slate-500 text-sm">{deviceInfo.description}</p>
              )}
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                Total: {meta.total} records
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-red-500/8 text-red-400 border border-red-500/20">
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-8">
        {[
          { label: 'Total Records', value: meta.total || 0, icon: '📈' },
          { label: 'Showing', value: sensorData.length, icon: '📋' },
          { label: 'Devices', value: devices.length, icon: '📡' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden bg-surface-card border border-white/5 rounded-xl p-5 transition-all duration-200 hover:border-white/10 hover:shadow-[0_0_20px_rgba(51,120,255,0.15)] group"
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{stat.label}</div>
            <div className="text-3xl font-extrabold text-slate-100">{stat.value}</div>
            <div className="absolute top-4 right-4 text-2xl opacity-30">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500 text-sm gap-3">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          Loading sensor data...
        </div>
      ) : sensorData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-5xl mb-4 opacity-30">📭</div>
          <div className="text-lg font-semibold text-slate-400 mb-2">No Data Found</div>
          <div className="text-slate-500 text-sm max-w-[360px]">
            {selectedDevice ? 'No sensor data available for this device yet.' : 'No sensor data has been recorded yet.'}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full border-collapse text-sm" id="sensor-data-table">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-border-default whitespace-nowrap">ID</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-border-default whitespace-nowrap">Payload</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-border-default whitespace-nowrap">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {sensorData.map((item) => (
                <tr key={item.id} className="transition-colors duration-150 hover:bg-blue-500/[0.04] border-b border-white/5 last:border-b-0">
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      #{item.id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-2">{renderPayload(item.payload)}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
