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

module.exports = { receiveSensorData };
