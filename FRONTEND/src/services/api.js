const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw { status: response.status, ...data };
  }
  return data;
};

// ==========================================
// SENSOR DATA (Public)
// ==========================================

export const sensorDataApi = {
  // GET /api/sensor-data?limit=50&device_id=xxx
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit);
    if (params.device_id) query.set('device_id', params.device_id);

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
