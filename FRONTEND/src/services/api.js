const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

const getHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (response) => {
  // Handle CSV blob responses
  if (response.headers.get('content-type')?.includes('text/csv')) {
    if (!response.ok) throw { status: response.status, message: 'Export failed' };
    return response;
  }
  const data = await response.json();
  if (!response.ok) {
    throw { status: response.status, ...data };
  }
  return data;
};

// ==========================================
// AUTH
// ==========================================

export const authApi = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },
};

// ==========================================
// PUBLIC SETTINGS
// ==========================================

export const settingsApi = {
  getPublic: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse(res);
  },
};

// ==========================================
// ADMIN API
// ==========================================

export const adminApi = {
  // Settings
  getSettings: async (token) => {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: getHeaders(token),
    });
    return handleResponse(res);
  },

  updateThresholds: async (token, data) => {
    const res = await fetch(`${API_BASE}/admin/settings/thresholds`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateStationInfo: async (token, data) => {
    const res = await fetch(`${API_BASE}/admin/settings/station-info`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateMapCoordinates: async (token, data) => {
    const res = await fetch(`${API_BASE}/admin/settings/map-coordinates`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateSensorConfig: async (token, data) => {
    const res = await fetch(`${API_BASE}/admin/settings/sensor-config`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Sensor Data (admin)
  getSensorData: async (token, params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const res = await fetch(`${API_BASE}/admin/sensor-data?${query.toString()}`, {
      headers: getHeaders(token),
    });
    return handleResponse(res);
  },

  // Export CSV
  exportCSV: async (token, params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const res = await fetch(`${API_BASE}/admin/export-csv?${query.toString()}`, {
      headers: getHeaders(token),
    });
    return handleResponse(res);
  },
};

// ==========================================
// SENSOR DATA (Public)
// ==========================================

export const sensorDataApi = {
  // GET /api/sensor-data?limit=50&device_id=xxx&interval=5min
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit);
    if (params.device_id) query.set('device_id', params.device_id);
    if (params.interval) query.set('interval', params.interval);

    const res = await fetch(`${API_BASE}/sensor-data?${query.toString()}`);
    return handleResponse(res);
  },

  // GET /api/sensor-data/latest?device_id=xxx
  getLatest: async (device_id) => {
    const query = new URLSearchParams();
    if (device_id) query.set('device_id', device_id);

    const res = await fetch(`${API_BASE}/sensor-data/latest?${query.toString()}`);
    return handleResponse(res);
  },
};
