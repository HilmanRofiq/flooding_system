const mongoose = require("mongoose");

const SensorDataSchema = new mongoose.Schema({
  device_id: String,

  distance_cm: Number,   // <-- RAW dari ESP
  water_level: Number,   // <-- hasil perhitungan server

  soil_raw: Number,
  status: String,

  waktu: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SensorData", SensorDataSchema);