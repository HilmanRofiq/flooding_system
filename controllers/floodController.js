const SensorData = require("../models/SensorData");
const { sendWhatsApp } = require("../services/whatsappService");
const { shouldSendAlert } = require("../utils/alertGuard");


// ====== PARAMETER KALIBRASI ======
const OFFSET_CM = 0;
const AMAN_MAX = 100;
const WASPADA_MAX = 150;
const SIAGA_MAX = 200;


function getStatus(level) {
  if (level <= AMAN_MAX) return "AMAN";
  if (level <= WASPADA_MAX) return "WASPADA";
  if (level <= SIAGA_MAX) return "SIAGA";
  return "BAHAYA";
}

const receiveFloodData = async (req, res) => {
  console.log("=== DATA MASUK DARI ESP ===");
  console.log("Time:", new Date().toISOString());
  console.log("Payload:", req.body);

  try {
    const { device_id, water_level, soil_raw } = req.body;

    if (!device_id || water_level == null) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const calibratedLevel = water_level + OFFSET_CM;
    const status = getStatus(calibratedLevel);

    console.log(`Device ${device_id} | Level: ${calibratedLevel} | Status: ${status}`);

    await SensorData.create({
      device_id,
      water_level: calibratedLevel,
      soil_raw,
      status
    });

        // ===== WHATSAPP ALERT (AMAN) =====
    if (shouldSendAlert(status)) {
    const message = `
    ⚠️ PERINGATAN BANJIR ⚠️
    Device : ${device_id}
    Tinggi : ${calibratedLevel.toFixed(1)} cm
    Status : ${status}

    Mohon waspada.
    `;
    await sendWhatsApp(message);
    }


    console.log(
      `[${device_id}] Water: ${calibratedLevel} cm | Status: ${status}`
    );

    const sirine = status === "SIAGA" || status === "BAHAYA";

    res.json({
      ok: true,
      status,
      sirine
    });

  } catch (err) {
    console.error("Flood error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { receiveFloodData };

