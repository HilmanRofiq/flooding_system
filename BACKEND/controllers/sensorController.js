const { getCachedSettings } = require("../controllers/settingsController");
const { sendWhatsApp } = require("../services/whatsappService");
const { shouldSendAlert } = require("../utils/alertGuard");
const SensorData = require("../models/SensorData");

// Dynamic status from cached settings
async function getFloodStatusDynamic(tinggi_air) {
  const settings = await getCachedSettings();
  const t = settings.thresholds;
  if (tinggi_air <= t.aman_max) return "AMAN";
  if (tinggi_air <= t.waspada_max) return "WASPADA";
  if (tinggi_air <= t.siaga_max) return "SIAGA";
  return "BAHAYA";
}

const receiveSensorData = async (req, res) => {
  const { tinggi_air } = req.body;
  console.log(`[${new Date().toISOString()}] POST /api/sensor — body:`, req.body);

  if (tinggi_air === undefined) {
    return res.status(400).json({ error: "tinggi_air wajib dikirim" });
  }

  const status = await getFloodStatusDynamic(tinggi_air);

  // simpan ke DB
  await SensorData.create({ tinggi_air, status });

  // kirim WA kalau status berubah & level penting
  if (shouldSendAlert(status)) {
    const message = `
⚠️ PERINGATAN BANJIR ⚠️

Tinggi air: ${tinggi_air} cm
Status: ${status}

Segera waspada!
    `;
    await sendWhatsApp(message);
  }

  console.log(`Tinggi air: ${tinggi_air} cm | Status: ${status}`);

  res.json({
    status: "OK",
    tinggi_air,
    kondisi: status,
  });
};

// Helper: get interval milliseconds from string
function getIntervalMs(interval) {
  switch (interval) {
    case '5min':  return 5 * 60 * 1000;
    case '15min': return 15 * 60 * 1000;
    case '30min': return 30 * 60 * 1000;
    case '1hour': return 60 * 60 * 1000;
    case '1day':  return 24 * 60 * 60 * 1000;
    default:      return null;
  }
}

// GET /api/sensor-data?limit=50&device_id=ESP-01&interval=5min
const getSensorData = async (req, res) => {
  try {
    const { limit = 50, device_id, interval } = req.query;
    console.log(`[${new Date().toISOString()}] GET /api/sensor-data — query:`, req.query);

    const filter = {};

    // Prevent NoSQL injection by ensuring device_id is a string
    if (device_id && typeof device_id === 'string') {
      filter.device_id = device_id;
    }

    // Parse and guard the limit to a maximum of 500
    let queryLimit = parseInt(limit, 10);
    if (isNaN(queryLimit) || queryLimit <= 0) queryLimit = 50;
    if (queryLimit > 500) queryLimit = 500;

    const intervalMs = getIntervalMs(interval);

    // If an interval is specified, use MongoDB aggregation to group data
    // limit = how many time buckets to return (most recent N buckets)
    if (intervalMs) {
      const pipeline = [];

      // Match by device filter only (no time window) — take data from all time
      if (Object.keys(filter).length > 0) {
        pipeline.push({ $match: filter });
      }

      // Sort descending first
      pipeline.push({ $sort: { waktu: -1 } });

      // Group by time bucket
      pipeline.push({
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: "$waktu" },
                { $mod: [{ $toLong: "$waktu" }, intervalMs] }
              ]
            }
          },
          device_id: { $first: "$device_id" },
          water_level: { $avg: "$water_level" },
          distance_cm: { $avg: "$distance_cm" },
          soil_raw: { $avg: "$soil_raw" },
          status: { $first: "$status" },
          count: { $sum: 1 }
        }
      });

      // Sort grouped results descending
      pipeline.push({ $sort: { _id: -1 } });

      // Limit final output
      pipeline.push({ $limit: queryLimit });

      pipeline.push({
        $project: {
          _id: 0,
          device_id: 1,
          water_level: { $round: ["$water_level", 1] },
          distance_cm: { $round: ["$distance_cm", 1] },
          soil_raw: { $round: ["$soil_raw", 0] },
          status: 1,
          waktu: "$_id",
          count: 1
        }
      });

      const data = await SensorData.aggregate(pipeline);
      const total = await SensorData.countDocuments(filter);

      return res.json({
        success: true,
        data,
        meta: { total, showing: data.length, interval: interval || 'raw' }
      });
    }

    // Default: raw data without aggregation
    const data = await SensorData.find(filter)
      .sort({ waktu: -1 })
      .limit(queryLimit);

    const total = await SensorData.countDocuments(filter);

    res.json({ success: true, data, meta: { total, showing: data.length, interval: 'raw' } });
  } catch (err) {
    console.error("getSensorData error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/sensor-data/latest?device_id=ESP-01
const getLatestSensorData = async (req, res) => {
  try {
    const { device_id } = req.query;
    console.log(`[${new Date().toISOString()}] GET /api/sensor-data/latest — query:`, req.query);

    const filter = {};

    // Prevent NoSQL injection by ensuring device_id is a string
    if (device_id && typeof device_id === 'string') {
      filter.device_id = device_id;
    }

    const latest = await SensorData.findOne(filter).sort({ waktu: -1 });

    if (!latest) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: latest });
  } catch (err) {
    console.error("getLatestSensorData error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { receiveSensorData, getSensorData, getLatestSensorData };
