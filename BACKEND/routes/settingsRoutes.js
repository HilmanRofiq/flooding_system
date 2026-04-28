const express = require("express");
const router = express.Router();
const { getPublicSettings } = require("../controllers/settingsController");

// Public — get settings (thresholds, station info, map coords)
router.get("/", getPublicSettings);

module.exports = router;
