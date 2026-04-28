import { useState, useEffect, useCallback, useMemo } from 'react';
import HomePageSkeleton from '../components/HomePageSkeleton';
import { useTheme } from '../context/ThemeContext';
import { sensorDataApi, settingsApi } from '../services/api';
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

const STATUS_CONFIG = {
  AMAN:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', icon: '🟢', label: 'AMAN' },
  WASPADA: { color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', icon: '🟡', label: 'WASPADA' },
  SIAGA:   { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: '🟠', label: 'SIAGA' },
  BAHAYA:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '🔴', label: 'BAHAYA' },
};

const INTERVAL_OPTIONS = [
  { value: '', label: 'Semua Data (Raw)', unit: 'data' },
  { value: '5min', label: 'Setiap 5 Menit', unit: 'x 5 menit' },
  { value: '15min', label: 'Setiap 15 Menit', unit: 'x 15 menit' },
  { value: '30min', label: 'Setiap 30 Menit', unit: 'x 30 menit' },
  { value: '1hour', label: 'Setiap 1 Jam', unit: 'jam terakhir' },
  { value: '1day', label: 'Setiap Hari', unit: 'hari terakhir' },
];

export default function HomePage() {
  const { isDark, toggleTheme } = useTheme();
  const [latest, setLatest] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(50);
  const [interval, setInterval_] = useState('');
  const [meta, setMeta] = useState({ total: 0, showing: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isBackgroundRefetch, setIsBackgroundRefetch] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('grafik');
  const [dataView, setDataView] = useState('water');

  // Dynamic settings from API
  const [settings, setSettings] = useState(null);
  const AMAN_MAX = settings?.thresholds?.aman_max ?? 100;
  const WASPADA_MAX = settings?.thresholds?.waspada_max ?? 150;
  const SIAGA_MAX = settings?.thresholds?.siaga_max ?? 200;

  // Fetch settings once
  useEffect(() => {
    settingsApi.getPublic().then(res => {
      setSettings(res.data);
    }).catch(() => {});
  }, []);

  function getStatusFromLevel(level) {
    if (level == null) return 'AMAN';
    if (level <= AMAN_MAX) return 'AMAN';
    if (level <= WASPADA_MAX) return 'WASPADA';
    if (level <= SIAGA_MAX) return 'SIAGA';
    return 'BAHAYA';
  }

  // Fetch latest + historical data
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsBackgroundRefetch(true);
    setError('');
    try {
      const params = { limit };
      if (interval) params.interval = interval;

      const [latestRes, historyRes] = await Promise.all([
        sensorDataApi.getLatest(),
        sensorDataApi.getAll(params),
      ]);
      setLatest(latestRes.data || null);
      setSensorData(historyRes.data || []);
      setMeta(historyRes.meta || { total: 0, showing: 0 });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Gagal memuat data sensor');
    } finally {
      setLoading(false);
      setIsBackgroundRefetch(false);
    }
  }, [limit, interval]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => fetchData(true), 10000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, fetchData]);

  const currentStatus = latest?.status || getStatusFromLevel(latest?.water_level);
  const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.AMAN;

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
    return new Date(dateStr).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatLabel = (dateStr) => {
    if (interval === '1day') return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    if (interval === '1hour' || interval === '30min') return formatDateShort(dateStr);
    return formatTime(dateStr);
  };

  // ====== CHART DATA ======
  const chartData = useMemo(() => {
    const reversed = [...sensorData].reverse();
    const labels = reversed.map(d => formatLabel(d.waktu));
    if (dataView === 'soil') {
      const soilValues = reversed.map(d => d.soil_raw ?? 0);
      return { labels, datasets: [{ label: 'Kelembapan Tanah (raw)', data: soilValues, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 2.5, pointRadius: soilValues.length > 30 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: '#10b981', fill: true, tension: 0.3 }] };
    }
    const waterLevels = reversed.map(d => d.water_level ?? 0);
    return { labels, datasets: [{ label: 'Tinggi Muka Air (cm)', data: waterLevels, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 2.5, pointRadius: waterLevels.length > 30 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: '#3b82f6', fill: true, tension: 0.3 }] };
  }, [sensorData, dataView, interval]);

  const chartOptions = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff', titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569', borderColor: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.1)',
        borderWidth: 1, padding: 12, cornerRadius: 8, displayColors: false,
        callbacks: { label: (ctx) => dataView === 'soil' ? `Kelembapan Tanah: ${ctx.parsed.y.toFixed(0)} raw` : `Tinggi Air: ${ctx.parsed.y.toFixed(1)} cm` },
      },
    },
    scales: {
      x: { grid: { color: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)' }, ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 11 }, maxTicksLimit: 10 } },
      y: { min: 0, grid: { color: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)' }, ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 11 } } },
    },
  }), [isDark, dataView]);

  const thresholdPlugin = useMemo(() => ({
    id: 'thresholdLines',
    afterDraw: (chart) => {
      if (dataView === 'soil') return;
      const { ctx, chartArea: { left, right }, scales: { y } } = chart;
      const lines = [
        { value: AMAN_MAX, color: '#22c55e', label: 'AMAN' },
        { value: WASPADA_MAX, color: '#eab308', label: 'WASPADA' },
        { value: SIAGA_MAX, color: '#ef4444', label: 'SIAGA' },
      ];
      lines.forEach(({ value, color, label }) => {
        const yPos = y.getPixelForValue(value);
        if (yPos < chart.chartArea.top || yPos > chart.chartArea.bottom) return;
        ctx.save(); ctx.beginPath(); ctx.setLineDash([6, 4]); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        ctx.moveTo(left, yPos); ctx.lineTo(right, yPos); ctx.stroke();
        ctx.fillStyle = color; ctx.font = '10px Inter, sans-serif'; ctx.fillText(`${label} (${value}cm)`, right - 100, yPos - 5);
        ctx.restore();
      });
    },
  }), [dataView, AMAN_MAX, WASPADA_MAX, SIAGA_MAX]);

  const StatusBadge = ({ status, size = 'sm' }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.AMAN;
    const isCritical = status === 'SIAGA' || status === 'BAHAYA';
    const sizeClass = size === 'lg' ? 'px-6 py-3 text-lg' : 'px-3 py-1 text-xs';
    return (
      <span className={`inline-flex items-center gap-2 rounded-full font-bold border ${sizeClass} ${isCritical ? 'animate-pulse-status' : ''}`}
        style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  const currentIntervalLabel = INTERVAL_OPTIONS.find(o => o.value === interval)?.label || 'Semua Data';
  const currentIntervalUnit = INTERVAL_OPTIONS.find(o => o.value === interval)?.unit || 'data';

  // Station info from settings
  const stationInfo = settings?.stationInfo || {};
  const mapCoords = settings?.mapCoordinates || { lat: -6.9175, lng: 107.6191, zoom: 13 };
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lng - 0.02},${mapCoords.lat - 0.015},${mapCoords.lng + 0.02},${mapCoords.lat + 0.015}&layer=mapnik&marker=${mapCoords.lat},${mapCoords.lng}`;

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
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-base">🌊</div>
            <div>
              <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent block leading-tight">Flooding System</span>
              <span className="text-[0.65rem] text-text-muted leading-none">Sistem Peringatan Dini</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isDeviceActive ? 'bg-badge-green-bg text-badge-green-text border-badge-green-border' : 'bg-badge-red-bg text-badge-red-text border-badge-red-border'}`}>
              <span className={`w-2 h-2 rounded-full ${isDeviceActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {isDeviceActive ? 'Device Aktif' : 'Device Offline'}
            </div>
            <button onClick={toggleTheme} id="theme-toggle" className="w-10 h-10 rounded-xl bg-surface-card border border-border-default flex items-center justify-center text-lg hover:bg-surface-card-hover hover:border-border-hover transition-all duration-200 active:scale-90 cursor-pointer" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {loading && !sensorData.length ? (
          <HomePageSkeleton />
        ) : (
          <>
            {/* Station Header */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2">
                📍 {stationInfo.name || 'Pos Monitoring'}
                {latest?.device_id && <span className="text-text-muted font-medium text-base">— {latest.device_id}</span>}
              </h1>
              <p className="text-text-muted text-sm mt-0.5">{stationInfo.type || 'Pos Tinggi Muka Air'} — Sistem Monitoring Real-time</p>
            </div>
            <div className="flex items-center gap-2">
              {!isDeviceActive && latest && (
                <span className="text-xs text-badge-amber-text bg-badge-amber-bg border border-badge-amber-border px-3 py-1.5 rounded-lg">⚠️ Alat tidak aktif lebih dari 1 jam</span>
              )}
            </div>
          </div>
        </header>

        {/* STATUS BAR */}
        <div className="rounded-2xl p-5 sm:p-6 mb-6 border-2 transition-all duration-500" style={{ backgroundColor: statusCfg.bg, borderColor: statusCfg.border }} id="status-bar">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl sm:text-5xl">{statusCfg.icon}</div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Status Saat Ini</div>
                <div className="text-2xl sm:text-3xl font-black" style={{ color: statusCfg.color }}>{statusCfg.label}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${currentStatus === key ? 'scale-110 shadow-md' : 'opacity-40'}`}
                  style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                  {cfg.icon} {cfg.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button onClick={() => setDataView('water')} className={`relative overflow-hidden bg-surface-card border rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-[0_0_20px_var(--color-card-glow)] group text-left cursor-pointer ${dataView === 'water' ? 'border-blue-500/50 ring-2 ring-blue-500/20' : 'border-border-default hover:border-border-hover'}`} id="card-water-level">
            <div className="absolute inset-x-0 top-0 h-1 transition-opacity duration-200" style={{ backgroundColor: statusCfg.color }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tinggi Muka Air</span>
              <span className="text-2xl opacity-30">🌊</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-text-primary mb-1">
              {latest?.water_level != null ? `${latest.water_level.toFixed(1)}` : '—'}<span className="text-lg font-semibold text-text-muted ml-1">cm</span>
            </div>
            <StatusBadge status={currentStatus} />
            {dataView === 'water' && <div className="absolute bottom-2 right-3 text-[0.6rem] font-semibold text-blue-400 uppercase tracking-wider">● Aktif</div>}
          </button>

          <button onClick={() => setDataView('water')} className={`relative overflow-hidden bg-surface-card border rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-[0_0_20px_var(--color-card-glow)] group text-left cursor-pointer ${dataView === 'water' ? 'border-blue-500/50 ring-2 ring-blue-500/20' : 'border-border-default hover:border-border-hover'}`} id="card-distance">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Jarak Sensor</span>
              <span className="text-2xl opacity-30">📏</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-text-primary mb-1">
              {latest?.distance_cm != null ? `${latest.distance_cm.toFixed(1)}` : '—'}<span className="text-lg font-semibold text-text-muted ml-1">cm</span>
            </div>
            <span className="text-xs text-text-muted">Jarak sensor ke permukaan air</span>
          </button>

          <button onClick={() => setDataView('soil')} className={`relative overflow-hidden bg-surface-card border rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-[0_0_20px_var(--color-card-glow)] group text-left cursor-pointer ${dataView === 'soil' ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-border-default hover:border-border-hover'}`} id="card-soil-moisture">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transition-opacity duration-200 ${dataView === 'soil' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Kelembapan Tanah</span>
              <span className="text-2xl opacity-30">🌱</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-text-primary mb-1">
              {latest?.soil_raw != null ? latest.soil_raw : '—'}<span className="text-lg font-semibold text-text-muted ml-1">raw</span>
            </div>
            <span className="text-xs text-text-muted">Klik untuk lihat data kelembapan tanah</span>
            {dataView === 'soil' && <div className="absolute bottom-2 right-3 text-[0.6rem] font-semibold text-emerald-400 uppercase tracking-wider">● Aktif</div>}
          </button>
        </div>

        {/* Data View Indicator */}
        {dataView === 'soil' && (
          <div className="flex items-center gap-2 mb-4 animate-slide-down">
            <div className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2.5 bg-badge-green-bg text-badge-green-text border border-badge-green-border">
              🌱 Menampilkan data <strong>Kelembapan Tanah</strong>
              <button onClick={() => setDataView('water')} className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-badge-green-text/20 hover:bg-badge-green-text/30 transition-colors cursor-pointer">✕ Kembali ke Air</button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div>
            <label className="block text-[0.65rem] font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Rentang Waktu</label>
            <select className="px-3 py-2 bg-surface-input border border-border-default rounded-lg text-text-primary text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 appearance-none cursor-pointer pr-8" value={interval} onChange={(e) => setInterval_(e.target.value)} id="interval-select">
              {INTERVAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[0.65rem] font-semibold text-text-muted mb-1.5 uppercase tracking-wide">{interval ? 'Jumlah Waktu' : 'Data Limit'}</label>
            <select className="px-3 py-2 bg-surface-input border border-border-default rounded-lg text-text-primary text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 appearance-none cursor-pointer pr-8" value={limit} onChange={(e) => setLimit(Number(e.target.value))} id="limit-select">
              {[25, 50, 100, 200, 500].map(n => <option key={n} value={n}>{n} {currentIntervalUnit}</option>)}
            </select>
          </div>
          <button onClick={fetchData} id="refresh-btn" className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary text-sm font-semibold hover:bg-surface-card-hover hover:border-border-hover transition-all duration-200 active:scale-95 mt-auto cursor-pointer">🔄 Refresh</button>
          <button onClick={() => setAutoRefresh(!autoRefresh)} id="auto-refresh-btn" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 mt-auto cursor-pointer ${autoRefresh ? 'bg-badge-green-bg border border-badge-green-border text-badge-green-text' : 'bg-surface-elevated border border-border-default text-text-secondary hover:bg-surface-card-hover'}`}>
            {autoRefresh ? '⏸ Auto: ON (10s)' : '▶ Auto: OFF'}
          </button>
          {lastUpdated && (
            <span className="text-xs text-text-dim ml-auto hidden sm:block">
              Update terakhir: {lastUpdated.toLocaleTimeString('id-ID')}
              {interval && <span className="ml-2 px-1.5 py-0.5 rounded bg-badge-blue-bg text-badge-blue-text border border-badge-blue-border text-[0.6rem]">{currentIntervalLabel}</span>}
            </span>
          )}
        </div>

        {error && <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 mb-4 animate-slide-down bg-badge-red-bg text-badge-red-text border border-badge-red-border">⚠️ {error}</div>}

        {/* TAB NAVIGATION */}
        <div className="mb-6" id="tab-navigation">
          <div className="flex border-b border-border-default">
            {[
              { key: 'grafik', label: '📊 Grafik' },
              { key: 'telemetri', label: '📋 Data Telemetri' },
              { key: 'info', label: 'ℹ️ Informasi Pos' },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 sm:px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 cursor-pointer ${activeTab === tab.key ? 'border-blue-500 text-blue-500' : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-hover'}`} id={`tab-${tab.key}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT */}
        {loading && !isBackgroundRefetch && sensorData.length > 0 && (
          <div className="flex items-center gap-2 mb-4 text-text-muted text-sm">
            <div className="w-4 h-4 border-2 border-border-default border-t-blue-500 rounded-full animate-spin" />
            <span>Memuat ulang data...</span>
          </div>
        )}

        {/* GRAFIK TAB */}
            {activeTab === 'grafik' && (
              <div className="animate-slide-down">
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 sm:p-6 mb-6">
                  <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    {dataView === 'soil' ? '🌱 Grafik Kelembapan Tanah' : '📈 Grafik Tinggi Muka Air'}
                    <span className="text-xs font-normal text-text-muted">({meta.showing} data{interval ? `, ${currentIntervalLabel}` : ''})</span>
                  </h3>
                  <div className="h-[300px] sm:h-[400px]">
                    {sensorData.length > 0 ? (
                      <Line key={`chart-main-${dataView}`} data={chartData} options={chartOptions} plugins={dataView === 'water' ? [thresholdPlugin] : []} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-text-muted text-sm">Belum ada data</div>
                    )}
                  </div>
                </div>

                {dataView === 'water' && (
                  <div className="bg-surface-card border border-border-default rounded-2xl p-4 sm:p-6">
                    <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">📏 Grafik Jarak Sensor</h3>
                    <div className="h-[250px] sm:h-[300px]">
                      {sensorData.length > 0 ? (
                        <Line data={{ labels: [...sensorData].reverse().map(d => formatLabel(d.waktu)), datasets: [{ label: 'Jarak Sensor (cm)', data: [...sensorData].reverse().map(d => d.distance_cm ?? 0), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 2, pointRadius: sensorData.length > 30 ? 0 : 3, fill: true, tension: 0.3 }] }} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: undefined } } }} />
                      ) : (
                        <div className="flex items-center justify-center h-full text-text-muted text-sm">Belum ada data</div>
                      )}
                    </div>
                  </div>
                )}

                {dataView === 'soil' && (
                  <div className="bg-surface-card border border-border-default rounded-2xl p-4 sm:p-6">
                    <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">📊 Statistik Kelembapan Tanah</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {(() => {
                        const soilValues = sensorData.map(d => d.soil_raw).filter(v => v != null);
                        const avg = soilValues.length ? (soilValues.reduce((a, b) => a + b, 0) / soilValues.length).toFixed(0) : '—';
                        const min = soilValues.length ? Math.min(...soilValues) : '—';
                        const max = soilValues.length ? Math.max(...soilValues) : '—';
                        const latest_ = soilValues.length ? soilValues[0] : '—';
                        return [
                          { label: 'Terbaru', value: latest_, color: 'text-emerald-400' },
                          { label: 'Rata-rata', value: avg, color: 'text-blue-400' },
                          { label: 'Minimum', value: min, color: 'text-cyan-400' },
                          { label: 'Maksimum', value: max, color: 'text-amber-400' },
                        ].map(stat => (
                          <div key={stat.label} className="bg-surface-elevated rounded-xl p-4 text-center">
                            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">{stat.label}</div>
                            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TELEMETRI TAB */}
            {activeTab === 'telemetri' && (
              <div className="animate-slide-down">
                <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                  <div className="px-4 sm:px-6 py-4 border-b border-border-default flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text-primary">{dataView === 'soil' ? '🌱 Data Kelembapan Tanah' : '📋 Data Telemetri'}</h3>
                    <span className="text-xs text-text-muted">{meta.total} total records{interval ? ` • ${currentIntervalLabel}` : ''}</span>
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse text-sm" id="sensor-data-table">
                      <thead className="bg-surface-elevated">
                        <tr>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Waktu</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Device</th>
                          {dataView === 'soil' ? (
                            <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Kelembapan Tanah (raw)</th>
                          ) : (
                            <>
                              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Jarak (cm)</th>
                              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Tinggi Air (cm)</th>
                              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Tanah</th>
                            </>
                          )}
                          <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Status</th>
                          {interval && <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border-default">Jumlah Data</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {sensorData.map((item, idx) => {
                          const st = item.status || getStatusFromLevel(item.water_level);
                          const stCfg = STATUS_CONFIG[st] || STATUS_CONFIG.AMAN;
                          return (
                            <tr key={item._id || idx} className="transition-colors duration-150 hover:bg-badge-blue-bg border-b border-border-subtle last:border-b-0">
                              <td className="px-4 py-3.5 text-text-secondary text-xs whitespace-nowrap">{formatDate(item.waktu)}</td>
                              <td className="px-4 py-3.5"><span className="text-sm font-medium text-text-primary">{item.device_id || '—'}</span></td>
                              {dataView === 'soil' ? (
                                <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-emerald-400">{item.soil_raw != null ? item.soil_raw : '—'}</td>
                              ) : (
                                <>
                                  <td className="px-4 py-3.5 text-right font-mono text-sm text-text-secondary">{item.distance_cm != null ? (typeof item.distance_cm === 'number' ? item.distance_cm.toFixed(1) : item.distance_cm) : '—'}</td>
                                  <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-text-primary">{item.water_level != null ? (typeof item.water_level === 'number' ? item.water_level.toFixed(1) : item.water_level) : '—'}</td>
                                  <td className="px-4 py-3.5 text-right font-mono text-sm text-text-secondary">{item.soil_raw != null ? item.soil_raw : '—'}</td>
                                </>
                              )}
                              <td className="px-4 py-3.5 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border" style={{ backgroundColor: stCfg.bg, color: stCfg.color, borderColor: stCfg.border }}>
                                  {stCfg.icon} {stCfg.label}
                                </span>
                              </td>
                              {interval && <td className="px-4 py-3.5 text-center text-xs text-text-muted">{item.count || 1}</td>}
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border" style={{ backgroundColor: stCfg.bg, color: stCfg.color, borderColor: stCfg.border }}>
                              {stCfg.icon} {stCfg.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div><div className="text-[0.65rem] text-text-muted uppercase">TMA</div><div className="text-sm font-bold text-text-primary">{item.water_level != null ? `${typeof item.water_level === 'number' ? item.water_level.toFixed(1) : item.water_level}cm` : '—'}</div></div>
                            <div><div className="text-[0.65rem] text-text-muted uppercase">Jarak</div><div className="text-sm font-bold text-text-secondary">{item.distance_cm != null ? `${typeof item.distance_cm === 'number' ? item.distance_cm.toFixed(1) : item.distance_cm}cm` : '—'}</div></div>
                            <div><div className="text-[0.65rem] text-text-muted uppercase">Tanah</div><div className="text-sm font-bold text-text-secondary">{item.soil_raw != null ? item.soil_raw : '—'}</div></div>
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

            {/* INFO POS TAB */}
            {activeTab === 'info' && (
              <div className="animate-slide-down">
                <div className="bg-surface-card border border-border-default rounded-2xl p-5 sm:p-6">
                  <h3 className="text-sm font-bold text-text-primary mb-5">ℹ️ Informasi Pos Monitoring</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Nama Pos', value: stationInfo.name || '-' },
                      { label: 'Tipe Pos', value: stationInfo.type || '-' },
                      { label: 'Nama Sungai', value: stationInfo.river || '-' },
                      { label: 'Lokasi', value: stationInfo.location || '-' },
                      { label: 'Device ID', value: latest?.device_id || '—' },
                      { label: 'Tinggi Sensor', value: `${settings?.sensorHeight ?? '-'} cm (dari dasar sungai)` },
                      { label: 'Offset Kalibrasi', value: `${settings?.offsetCm ?? 0} cm` },
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
                  {stationInfo.description && (
                    <div className="mt-4 pt-4 border-t border-border-default">
                      <div className="text-sm text-text-muted mb-1">Deskripsi</div>
                      <div className="text-sm text-text-primary">{stationInfo.description}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer with OpenStreetMap */}
      <footer className="relative z-10 border-t border-border-default" id="homepage-footer">
        {/* Map Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border-default" style={{ height: '280px' }}>
              <iframe
                title="Lokasi Pos Monitoring"
                width="100%"
                height="100%"
                src={mapUrl}
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
            {/* Info */}
            <div className="flex flex-col justify-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-sm">🌊</div>
                  <span className="text-base font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Flooding System</span>
                </div>
                <p className="text-sm text-text-muted">Sistem Peringatan Dini Banjir — Monitoring ketinggian air sungai secara real-time.</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">📍</span>
                  <span className="text-text-secondary">{stationInfo.location || 'Lokasi belum diatur'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">🏞️</span>
                  <span className="text-text-secondary">{stationInfo.river || 'Sungai belum diatur'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">🌐</span>
                  <span className="text-text-secondary">Lat: {mapCoords.lat}, Lng: {mapCoords.lng}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Copyright */}
        <div className="border-t border-border-default py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-dim">
            <span>© {new Date().getFullYear()} Flooding System — Sistem Peringatan Dini Banjir</span>
            <span className="flex items-center gap-1.5">Flooding System v2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
