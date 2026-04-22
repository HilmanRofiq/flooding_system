const SensorData = require("../models/SensorData");
const { sendWhatsApp } = require("../services/whatsappService");
const { shouldSendAlert } = require("../utils/alertGuard");
const { getCachedSettings } = require("./settingsController");

// ================= STATUS (dynamic from DB) =================
function getStatus(level, thresholds) {
  if (level <= thresholds.aman_max) return "AMAN";
  if (level <= thresholds.waspada_max) return "WASPADA";
  if (level <= thresholds.siaga_max) return "SIAGA";
  return "BAHAYA";
}

// ================= CONTROLLER =================
const receiveFloodData = async (req, res) => {
  console.log("=== DATA MASUK DARI ESP ===");
  console.log("Payload:", req.body);

  try {
    const { device_id, distance_cm, soil_raw } = req.body;

    if (!device_id || distance_cm == null) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // Get calibration settings from DB (cached 60s)
    const settings = await getCachedSettings();
    const SENSOR_HEIGHT = settings.sensorHeight;
    const OFFSET_CM = settings.offsetCm;
    const thresholds = settings.thresholds;

    // ===== KONVERSI JARAK → TINGGI AIR =====
    const water_level = SENSOR_HEIGHT - distance_cm + OFFSET_CM;

    const status = getStatus(water_level, thresholds);

    console.log(`Device ${device_id}`);
    console.log(`Distance : ${distance_cm} cm`);
    console.log(`Level    : ${water_level} cm`);
    console.log(`Status   : ${status}`);

    // ===== SIMPAN RAW + HASIL =====
    await SensorData.create({
      device_id,
      distance_cm,
      water_level,
      soil_raw,
      status
    });

    // ===== WHATSAPP ALERT =====
    if (shouldSendAlert(status)) {
      const message = `
⚠️ PERINGATAN BANJIR ⚠️
Device : ${device_id}
Tinggi Air : ${water_level.toFixed(1)} cm
Status : ${status}

Anda bisa melihat ketinggian air dari cctv menggunakan link BPBD di bawah ini:
https://bpbdkabbandung.higertech.com/
`;
      await sendWhatsApp(message);
    }

    res.json({
      ok: true,
      water_level,
      status
    });

  } catch (err) {
    console.error("Flood error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { receiveFloodData };