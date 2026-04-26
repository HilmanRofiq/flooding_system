const express = require("express");
const router = express.Router();
const { getSensorData, getLatestSensorData } = require("../controllers/sensorController");

router.get("/sensor-data", getSensorData);
router.get("/sensor-data/latest", getLatestSensorData);

module.exports = router;
