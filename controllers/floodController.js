const SensorData = require("../models/SensorData");
const { sendWhatsApp } = require("../services/whatsappService");
const { shouldSendAlert } = require("../utils/alertGuard");

// ===== PARAMETER KALIBRASI (BISA DIUBAH TANPA SENTUH ESP) =====
const SENSOR_HEIGHT = 200;   // tinggi sensor dari dasar sungai (cm)
const OFFSET_CM = 0;         // koreksi pemasangan fisik

const AMAN_MAX = 100;
const WASPADA_MAX = 150;
const SIAGA_MAX = 200;

// ================= STATUS =================
function getStatus(level) {
  if (level <= AMAN_MAX) return "AMAN";
  if (level <= WASPADA_MAX) return "WASPADA";
  if (level <= SIAGA_MAX) return "SIAGA";
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

    // ===== KONVERSI JARAK → TINGGI AIR =====
    const water_level = SENSOR_HEIGHT - distance_cm + OFFSET_CM;

    const status = getStatus(water_level);

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