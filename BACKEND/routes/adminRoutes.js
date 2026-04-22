const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const verifyAdmin = require("../middlewares/verifyAdmin");
const settingsController = require("../controllers/settingsController");
const exportController = require("../controllers/exportController");
const {
  validateThresholds,
  validateStationInfo,
  validateMapCoordinates,
  validateSensorConfig,
} = require("../utils/validators");

// All admin routes require authentication + admin check
router.use(verifyToken, verifyAdmin);

// Settings
router.get("/settings", settingsController.getSettings);
router.put("/settings/thresholds", validateThresholds, settingsController.updateThresholds);
router.put("/settings/station-info", validateStationInfo, settingsController.updateStationInfo);
router.put("/settings/map-coordinates", validateMapCoordinates, settingsController.updateMapCoordinates);
router.put("/settings/sensor-config", validateSensorConfig, settingsController.updateSensorConfig);

// Export
router.get("/export-csv", exportController.exportCSV);
router.get("/sensor-data", exportController.getSensorDataAdmin);

module.exports = router;
