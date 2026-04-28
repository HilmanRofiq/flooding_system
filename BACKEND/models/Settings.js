const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  // Singleton identifier — always "global"
  _key: {
    type: String,
    default: "global",
    unique: true,
    immutable: true,
  },

  // Threshold calibration (cm)
  thresholds: {
    aman_max: { type: Number, default: 80 },
    waspada_max: { type: Number, default: 120 },
    siaga_max: { type: Number, default: 140 },
  },

  // Sensor physical config
  sensorHeight: { type: Number, default: 350 },  // tinggi sensor dari dasar sungai (cm)
  offsetCm: { type: Number, default: 0 },         // koreksi pemasangan fisik

  // Station info (shown on homepage "Informasi Pos" tab)
  stationInfo: {
    name: { type: String, default: "Pos Monitoring Banjir" },
    type: { type: String, default: "Pos Tinggi Muka Air (TMA)" },
    description: { type: String, default: "Sistem monitoring ketinggian air sungai secara real-time menggunakan sensor ultrasonik." },
    river: { type: String, default: "-" },
    location: { type: String, default: "-" },
  },

  // OpenStreetMap coordinates (shown on homepage footer)
  mapCoordinates: {
    lat: { type: Number, default: -6.9175 },
    lng: { type: Number, default: 107.6191 },
    zoom: { type: Number, default: 13 },
  },
}, {
  timestamps: true,
});

/**
 * Get or create the singleton settings document.
 * Always returns exactly one document.
 */
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ _key: "global" });
  if (!settings) {
    settings = await this.create({ _key: "global" });
  }
  return settings;
};

module.exports = mongoose.model("Settings", SettingsSchema);
