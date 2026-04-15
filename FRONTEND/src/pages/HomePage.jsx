import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { sensorDataApi } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Threshold constants (matching backend floodController.js)
const AMAN_MAX = 100;
const WASPADA_MAX = 150;
const SIAGA_MAX = 200;

const STATUS_CONFIG = {
  AMAN:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', icon: '🟢', label: 'AMAN' },
  WASPADA: { color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', icon: '🟡', label: 'WASPADA' },
  SIAGA:   { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: '🟠', label: 'SIAGA' },
  BAHAYA:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '🔴', label: 'BAHAYA' },
};

function getStatusFromLevel(level) {
  if (level == null) return 'AMAN';
  if (level <= AMAN_MAX) return 'AMAN';
  if (level <= WASPADA_MAX) return 'WASPADA';
  if (level <= SIAGA_MAX) return 'SIAGA';
  return 'BAHAYA';
}

export default function HomePage() {
  const { isDark, toggleTheme } = useTheme();
  const [latest, setLatest] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(50);
  const [meta, setMeta] = useState({ total: 0, showing: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('grafik');

  // Fetch latest + historical data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [latestRes, historyRes] = await Promise.all([
        sensorDataApi.getLatest(),
        sensorDataApi.getAll({ limit }),
      ]);
      setLatest(latestRes.data || null);
      setSensorData(historyRes.data || []);
      setMeta(historyRes.meta || { total: 0, showing: 0 });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Gagal memuat data sensor');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const currentStatus = latest?.status || getStatusFromLevel(latest?.water_level);
  const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.AMAN;

  // Check if device is active (last data < 1 hour ago)
  const isDeviceActive = latest?.waktu
    ? (Date.now() - new Date(latest.waktu).getTime()) < 3600000
    : false;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ====== CHART DATA ======
  const chartData = useMemo(() => {
    const reversed = [...sensorData].reverse();
    const labels = reversed.map(d => formatTime(d.waktu));
    const waterLevels = reversed.map(d => d.water_level ?? 0);

    return {
      labels,
      datasets: [
        {
          label: 'Tinggi Muka Air (cm)',
          data: waterLevels,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderWidth: 2.5,
          pointRadius: waterLevels.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#3b82f6',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [sensorData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (ctx) => `Tinggi Air: ${ctx.parsed.y.toFixed(1)} cm`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)' },
        ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 11 }, maxTicksLimit: 10 },
      },
      y: {
        min: 0,
        grid: { color: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)' },
        ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 11 } },
      },
    },
  }), [isDark]);

  // Annotation plugin alternative: draw threshold lines via a custom plugin
  const thresholdPlugin = useMemo(() => ({
    id: 'thresholdLines',
    afterDraw: (chart) => {
      const { ctx, chartArea: { left, right }, scales: { y } } = chart;
      const lines = [
        { value: AMAN_MAX, color: '#22c55e', label: 'AMAN' },
        { value: WASPADA_MAX, color: '#eab308', label: 'WASPADA' },
        { value: SIAGA_MAX, color: '#ef4444', label: 'SIAGA' },
      ];
      lines.forEach(({ value, color, label }) => {
        const yPos = y.getPixelForValue(value);
        if (yPos < chart.chartArea.top || yPos > chart.chartArea.bottom) return;
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.moveTo(left, yPos);
        ctx.lineTo(right, yPos);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(`${label} (${value}cm)`, right - 100, yPos - 5);
        ctx.restore();
      });
    },
  }), []);

  // ====== STATUS BADGE ======
  const StatusBadge = ({ status, size = 'sm' }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.AMAN;
    const isCritical = status === 'SIAGA' || status === 'BAHAYA';
    const sizeClass = size === 'lg' ? 'px-6 py-3 text-lg' : 'px-3 py-1 text-xs';
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full font-bold border ${sizeClass} ${isCritical ? 'animate-pulse-status' : ''}`}
        style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
      >
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 bg-blue-500 -top-[200px] -right-[200px] animate-float" />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 bg-cyan-400 -bottom-[200px] -left-[200px] animate-float-delayed" />
      </div>

      {/* Navbar */}
      <nav className="bg-nav-bg backdrop-blur-xl border-b border-nav-border sticky top-0 z-50 shadow-sm" id="public-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-base">
              🌊
            </div>
            <div>
              <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent block leading-tight">
                Monitoring Banjir
              </span>
              <span className="text-[0.65rem] text-text-muted leading-none">Sistem Peringatan Dini</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Device status indicator */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isDeviceActive
              ? 'bg-badge-green-bg text-badge-green-text border-badge-green-border'
              : 'bg-badge-red-bg text-badge-red-text border-badge-red-border'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isDeviceActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {isDeviceActive ? 'Device Aktif' : 'Device Offline'}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              id="theme-toggle"
              className="w-10 h-10 rounded-xl bg-surface-card border border-border-default flex items-center justify-center text-lg hover:bg-surface-card-hover hover:border-border-hover transition-all duration-200 active:scale-90 cursor-pointer"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">

        {/* Station Header */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2">
                📍 Pos Monitoring
                {latest?.device_id && (
                  <span className="text-text-muted font-medium text-base">— {latest.device_id}</span>
                )}
              </h1>
              <p className="text-text-muted text-sm mt-0.5">Pos Tinggi Muka Air — Sistem Monitoring Real-time</p>
            </div>
            <div className="flex items-center gap-2">
              {!isDeviceActive && latest && (
                <span className="text-xs text-badge-amber-text bg-badge-amber-bg border border-badge-amber-border px-3 py-1.5 rounded-lg">
                  ⚠️ Alat tidak aktif lebih dari 1 jam
                </span>
              )}
            </div>
          </div>
        </header>

        {/* STATUS BAR */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6 border-2 transition-all duration-500"
          style={{ backgroundColor: statusCfg.bg, borderColor: statusCfg.border }}
          id="status-bar"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl sm:text-5xl">{statusCfg.icon}</div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Status Saat Ini</div>
                <div className="text-2xl sm:text-3xl font-black" style={{ color: statusCfg.color }}>
                  {statusCfg.label}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div
                  key={key}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    currentStatus === key ? 'scale-110 shadow-md' : 'opacity-40'
                  }`}
                  style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                >
                  {cfg.icon} {cfg.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Water Level Card */}
          <div className="relative overflow-hidden bg-surface-card border border-border-default rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-border-hover hover:shadow-[0_0_20px_var(--color-card-glow)] group">
            <div className="absolute inset-x-0 top-0 h-1 transition-opacity duration-200" style={{ backgroundColor: statusCfg.color }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tinggi Muka Air</span>
              <span className="text-2xl opacity-30">🌊</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-text-primary mb-1">
              {latest?.water_level != null ? `${latest.water_level.toFixed(1)}` : '—'}
              <span className="text-lg font-semibold text-text-muted ml-1">cm</span>
            </div>
            <StatusBadge status={currentStatus} />
          </div>

          {/* Distance Card */}
          <div className="relative overflow-hidden bg-surface-card border border-border-default rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-border-hover hover:shadow-[0_0_20px_var(--color-card-glow)] group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Jarak Sensor</span>
              <span className="text-2xl opacity-30">📏</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-text-primary mb-1">
              {latest?.distance_cm != null ? `${latest.distance_cm.toFixed(1)}` : '—'}
              <span className="text-lg font-semibold text-text-muted ml-1">cm</span>
            </div>
            <span className="text-xs text-text-muted">Jarak sensor ke permukaan air</span>
          </div>

          {/* Soil Moisture Card */}
          <div className="relative overflow-hidden bg-surface-card border border-border-default rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-border-hover hover:shadow-[0_0_20px_var(--color-card-glow)] group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Kelembapan Tanah</span>
              <span className="text-2xl opacity-30">🌱</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-text-primary mb-1">
              {latest?.soil_raw != null ? latest.soil_raw : '—'}
              <span className="text-lg font-semibold text-text-muted ml-1">raw</span>
            </div>
            <span className="text-xs text-text-muted">Nilai analog sensor tanah</span>
          </div>
        </div>

        {/* Last updated + Controls */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div>
            <label className="block text-[0.65rem] font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Data Limit</label>
            <select
              className="px-3 py-2 bg-surface-input border border-border-default rounded-lg text-text-primary text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 appearance-none cursor-pointer pr-8"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              id="limit-select"
            >
              <option value={25}>25 data</option>
              <option value={50}>50 data</option>
              <option value={100}>100 data</option>
              <option value={200}>200 data</option>
              <option value={500}>500 data</option>
            </select>
          </div>

          <button
            onClick={fetchData}
            id="refresh-btn"
            className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary text-sm font-semibold hover:bg-surface-card-hover hover:border-border-hover transition-all duration-200 active:scale-95 mt-auto cursor-pointer"
          >
            🔄 Refresh
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            id="auto-refresh-btn"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 mt-auto cursor-pointer ${
              autoRefresh
                ? 'bg-badge-green-bg border border-badge-green-border text-badge-green-text'
                : 'bg-surface-elevated border border-border-default text-text-secondary hover:bg-surface-card-hover'
            }`}
          >
            {autoRefresh ? '⏸ Auto: ON (10s)' : '▶ Auto: OFF'}
          </button>

          {lastUpdated && (
            <span className="text-xs text-text-dim ml-auto hidden sm:block">
              Update terakhir: {lastUpdated.toLocaleTimeString('id-ID')}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-red-bg text-badge-red-text border border-badge-red-border">
            ⚠️ {error}
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div className="mb-6" id="tab-navigation">
          <div className="flex border-b border-border-default">
            {[
              { key: 'grafik', label: '📊 Grafik', icon: '📊' },
              { key: 'telemetri', label: '📋 Data Telemetri', icon: '📋' },
              { key: 'info', label: 'ℹ️ Informasi Pos', icon: 'ℹ️' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 sm:px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-hover'
                }`}
                id={`tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT */}
        {loading && !sensorData.length ? (
          <div className="flex items-center justify-center py-16 text-text-muted text-sm gap-3">
            <div className="w-5 h-5 border-2 border-border-default border-t-blue-500 rounded-full animate-spin" />
            Memuat data sensor...
          </div>
        ) : (
          <>
            {/* ====== GRAFIK TAB ====== */}
            {activeTab === 'grafik' && (
              <div className="animate-slide-down">
                {/* TMA Chart */}
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 sm:p-6 mb-6">
                  <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    📈 Grafik Tinggi Muka Air
                    <span className="text-xs font-normal text-text-muted">({meta.showing} data terakhir)</span>
                  </h3>
                  <div className="h-[300px] sm:h-[400px]">
                    {sensorData.length > 0 ? (
                      <Line data={chartData} options={chartOptions} plugins={[thresholdPlugin]} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-text-muted text-sm">
                        Belum ada data untuk ditampilkan
                      </div>
                    )}
                  </div>
                </div>

                {/* Distance Chart */}
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 sm:p-6">
                  <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    📏 Grafik Jarak Sensor
                  </h3>
                  <div className="h-[250px] sm:h-[300px]">
                    {sensorData.length > 0 ? (
                      <Line
                        data={{
                          labels: [...sensorData].reverse().map(d => formatTime(d.waktu)),
                          datasets: [{
                            label: 'Jarak Sensor (cm)',
                            data: [...sensorData].reverse().map(d => d.distance_cm ?? 0),
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139,92,246,0.1)',
                            borderWidth: 2,
                            pointRadius: sensorData.length > 30 ? 0 : 3,
                            fill: true,
                            tension: 0.3,
                          }],
                        }}
                        options={{
                          ...chartOptions,
                          scales: {
                            ...chartOptions.scales,
                            y: { ...chartOptions.scales.y, min: undefined },
                          },
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-text-muted text-sm">
                        Belum ada data untuk ditampilkan
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ====== DATA TELEMETRI TAB ====== */}
            {activeTab === 'telemetri' && (
              <div className="animate-slide-down">
                <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                  <div className="px-4 sm:px-6 py-4 border-b border-border-default flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text-primary">📋 Data Telemetri</h3>
                    <span className="text-xs text-text-muted">{meta.total} total records</span>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse text-sm" id="sensor-data-table">
                      <thead className="bg-surface-elevated">
                        <tr>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Waktu</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Device</th>
                          <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Jarak (cm)</th>
                          <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Tinggi Air (cm)</th>
                          <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Tanah</th>
                          <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sensorData.map((item, idx) => {
                          const st = item.status || getStatusFromLevel(item.water_level);
                          const stCfg = STATUS_CONFIG[st] || STATUS_CONFIG.AMAN;
                          return (
                            <tr key={item._id || idx} className="transition-colors duration-150 hover:bg-badge-blue-bg border-b border-border-subtle last:border-b-0">
                              <td className="px-4 py-3.5 text-text-secondary text-xs whitespace-nowrap">{formatDate(item.waktu)}</td>
                              <td className="px-4 py-3.5">
                                <span className="text-sm font-medium text-text-primary">{item.device_id || '—'}</span>
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-sm text-text-secondary">
                                {item.distance_cm != null ? item.distance_cm.toFixed(1) : '—'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-text-primary">
                                {item.water_level != null ? item.water_level.toFixed(1) : '—'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-sm text-text-secondary">
                                {item.soil_raw != null ? item.soil_raw : '—'}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border"
                                  style={{ backgroundColor: stCfg.bg, color: stCfg.color, borderColor: stCfg.border }}
                                >
                                  {stCfg.icon} {stCfg.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden divide-y divide-border-subtle">
                    {sensorData.map((item, idx) => {
                      const st = item.status || getStatusFromLevel(item.water_level);
                      const stCfg = STATUS_CONFIG[st] || STATUS_CONFIG.AMAN;
                      return (
                        <div key={item._id || idx} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-text-muted">{formatDate(item.waktu)}</span>
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border"
                              style={{ backgroundColor: stCfg.bg, color: stCfg.color, borderColor: stCfg.border }}
                            >
                              {stCfg.icon} {stCfg.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <div className="text-[0.65rem] text-text-muted uppercase">TMA</div>
                              <div className="text-sm font-bold text-text-primary">
                                {item.water_level != null ? `${item.water_level.toFixed(1)}cm` : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[0.65rem] text-text-muted uppercase">Jarak</div>
                              <div className="text-sm font-bold text-text-secondary">
                                {item.distance_cm != null ? `${item.distance_cm.toFixed(1)}cm` : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[0.65rem] text-text-muted uppercase">Tanah</div>
                              <div className="text-sm font-bold text-text-secondary">
                                {item.soil_raw != null ? item.soil_raw : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {sensorData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-5xl mb-4 opacity-30">📭</div>
                      <div className="text-lg font-semibold text-text-secondary mb-2">Belum Ada Data</div>
                      <div className="text-text-muted text-sm">Belum ada data sensor yang tercatat.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ====== INFO POS TAB ====== */}
            {activeTab === 'info' && (
              <div className="animate-slide-down">
                <div className="bg-surface-card border border-border-default rounded-2xl p-5 sm:p-6">
                  <h3 className="text-sm font-bold text-text-primary mb-5">ℹ️ Informasi Pos Monitoring</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Tipe Pos', value: 'Pos Tinggi Muka Air (TMA)' },
                      { label: 'Device ID', value: latest?.device_id || '—' },
                      { label: 'Tinggi Sensor', value: '200 cm (dari dasar sungai)' },
                      { label: 'Offset Kalibrasi', value: '0 cm' },
                      { label: 'Batas AMAN', value: `≤ ${AMAN_MAX} cm` },
                      { label: 'Batas WASPADA', value: `${AMAN_MAX + 1} — ${WASPADA_MAX} cm` },
                      { label: 'Batas SIAGA', value: `${WASPADA_MAX + 1} — ${SIAGA_MAX} cm` },
                      { label: 'Batas BAHAYA', value: `> ${SIAGA_MAX} cm` },
                      { label: 'Data Terakhir', value: formatDate(latest?.waktu) },
                      { label: 'Total Records', value: `${meta.total} data` },
                    ].map((info) => (
                      <div key={info.label} className="flex justify-between items-center py-3 border-b border-border-subtle last:border-b-0">
                        <span className="text-sm text-text-muted">{info.label}</span>
                        <span className="text-sm font-semibold text-text-primary">{info.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border-default py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-dim">
          <span>© {new Date().getFullYear()} Monitoring Banjir — Sistem Peringatan Dini</span>
          <span className="flex items-center gap-1.5">
            Made with <span className="text-red-400">❤</span> by Biru Langit
          </span>
        </div>
      </footer>
    </div>
  );
}
