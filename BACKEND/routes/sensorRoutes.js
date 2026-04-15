const express = require("express");
const router = express.Router();
const { receiveSensorData, getSensorData, getLatestSensorData } = require("../controllers/sensorController");

router.post("/sensor", receiveSensorData);
router.get("/sensor-data", getSensorData);
router.get("/sensor-data/latest", getLatestSensorData);

module.exports = router;
