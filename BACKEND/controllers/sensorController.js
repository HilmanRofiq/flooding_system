const { getFloodStatus } = require("../utils/floodStatus");
const { isStatusChanged } = require("../utils/statusCache");
const { sendWhatsApp } = require("../services/whatsappService");
const SensorData = require("../models/SensorData");

const receiveSensorData = async (req, res) => {
  const { tinggi_air } = req.body;

  if (tinggi_air === undefined) {
    return res.status(400).json({ error: "tinggi_air wajib dikirim" });
  }

  const status = getFloodStatus(tinggi_air);

  // simpan ke DB
  await SensorData.create({ tinggi_air, status });

  // kirim WA kalau status berubah & level penting
 if (status === "SIAGA" || status === "BAHAYA") {
  console.log(" MASUK BLOK KIRIM WHATSAPP");
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

// GET /api/sensor-data?limit=50&device_id=ESP-01
const getSensorData = async (req, res) => {
  try {
    const { limit = 50, device_id } = req.query;
    const filter = {};
    
    // Prevent NoSQL injection by ensuring device_id is a string
    if (device_id && typeof device_id === 'string') {
      filter.device_id = device_id;
    }

    // Parse and guard the limit to a maximum of 500
    let queryLimit = parseInt(limit, 10);
    if (isNaN(queryLimit) || queryLimit <= 0) queryLimit = 50;
    if (queryLimit > 500) queryLimit = 500;

    const data = await SensorData.find(filter)
      .sort({ waktu: -1 })
      .limit(queryLimit);

    const total = await SensorData.countDocuments(filter);

    res.json({ success: true, data, meta: { total, showing: data.length } });
  } catch (err) {
    console.error("getSensorData error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/sensor-data/latest?device_id=ESP-01
const getLatestSensorData = async (req, res) => {
  try {
    const { device_id } = req.query;
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
