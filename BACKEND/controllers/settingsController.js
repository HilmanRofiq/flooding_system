const { validationResult } = require("express-validator");
const Settings = require("../models/Settings");

/**
 * GET /api/settings
 * Public — return settings for homepage use
 */
const getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: {
        thresholds: settings.thresholds,
        sensorHeight: settings.sensorHeight,
        offsetCm: settings.offsetCm,
        stationInfo: settings.stationInfo,
        mapCoordinates: settings.mapCoordinates,
      },
    });
  } catch (error) {
    console.error("getPublicSettings error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * GET /api/admin/settings
 * Admin only — return full settings
 */
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("getSettings error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * PUT /api/admin/settings/thresholds
 * Admin only — update flood level thresholds
 */
const updateThresholds = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  try {
    const { aman_max, waspada_max, siaga_max } = req.body;

    // Validate logical order: aman < waspada < siaga
    if (aman_max >= waspada_max || waspada_max >= siaga_max) {
      return res.status(400).json({
        success: false,
        message: "Threshold order must be: AMAN < WASPADA < SIAGA",
      });
    }

    const settings = await Settings.getSettings();
    settings.thresholds = {
      aman_max: Number(aman_max),
      waspada_max: Number(waspada_max),
      siaga_max: Number(siaga_max),
    };
    await settings.save();

    // Clear cached settings so controllers pick up new values
    clearSettingsCache();

    res.json({
      success: true,
      message: "Thresholds updated successfully",
      data: settings.thresholds,
    });
  } catch (error) {
    console.error("updateThresholds error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * PUT /api/admin/settings/station-info
 * Admin only — update station info
 */
const updateStationInfo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  try {
    const { name, type, description, river, location } = req.body;

    const settings = await Settings.getSettings();
    if (name !== undefined) settings.stationInfo.name = name;
    if (type !== undefined) settings.stationInfo.type = type;
    if (description !== undefined) settings.stationInfo.description = description;
    if (river !== undefined) settings.stationInfo.river = river;
    if (location !== undefined) settings.stationInfo.location = location;
    await settings.save();

    res.json({
      success: true,
      message: "Station info updated successfully",
      data: settings.stationInfo,
    });
  } catch (error) {
    console.error("updateStationInfo error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * PUT /api/admin/settings/map-coordinates
 * Admin only — update map coordinates
 */
const updateMapCoordinates = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  try {
    const { lat, lng, zoom } = req.body;

    const settings = await Settings.getSettings();
    settings.mapCoordinates = {
      lat: Number(lat),
      lng: Number(lng),
      zoom: zoom ? Number(zoom) : settings.mapCoordinates.zoom,
    };
    await settings.save();

    res.json({
      success: true,
      message: "Map coordinates updated successfully",
      data: settings.mapCoordinates,
    });
  } catch (error) {
    console.error("updateMapCoordinates error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * PUT /api/admin/settings/sensor-config
 * Admin only — update sensor height and offset
 */
const updateSensorConfig = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }

  try {
    const { sensorHeight, offsetCm } = req.body;

    const settings = await Settings.getSettings();
    settings.sensorHeight = Number(sensorHeight);
    if (offsetCm !== undefined) settings.offsetCm = Number(offsetCm);
    await settings.save();

    // Clear cached settings so controllers pick up new values
    clearSettingsCache();

    res.json({
      success: true,
      message: "Sensor config updated successfully",
      data: {
        sensorHeight: settings.sensorHeight,
        offsetCm: settings.offsetCm,
      },
    });
  } catch (error) {
    console.error("updateSensorConfig error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ==========================================
// SETTINGS CACHE (used by flood/sensor controllers)
// ==========================================

let _cachedSettings = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Get cached settings. Used by floodController and sensorController
 * to avoid querying DB on every sensor data POST.
 */
const getCachedSettings = async () => {
  const now = Date.now();
  if (_cachedSettings && (now - _cacheTimestamp) < CACHE_TTL) {
    return _cachedSettings;
  }
  _cachedSettings = await Settings.getSettings();
  _cacheTimestamp = now;
  return _cachedSettings;
};

const clearSettingsCache = () => {
  _cachedSettings = null;
  _cacheTimestamp = 0;
};

module.exports = {
  getPublicSettings,
  getSettings,
  updateThresholds,
  updateStationInfo,
  updateMapCoordinates,
  updateSensorConfig,
  getCachedSettings,
  clearSettingsCache,
};
