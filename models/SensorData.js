const mongoose = require("mongoose");

const SensorDataSchema = new mongoose.Schema({
  device_id: String,
  water_level: Number,
  soil_raw: Number,
  status: String,
  waktu: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SensorData", SensorDataSchema);
