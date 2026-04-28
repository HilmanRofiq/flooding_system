const { body } = require("express-validator");

// Login validation
const validateLogin = [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage("Email too long"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isString().withMessage("Password must be a string")
    .isLength({ min: 6, max: 128 }).withMessage("Password must be 6-128 characters"),
];

// Register validation (admin creates new user)
const validateRegister = [
  body("name")
    .notEmpty().withMessage("Name is required")
    .isString().withMessage("Name must be a string")
    .trim()
    .isLength({ min: 2, max: 255 }).withMessage("Name must be 2-255 characters"),
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage("Email too long"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isString().withMessage("Password must be a string")
    .isLength({ min: 6, max: 128 }).withMessage("Password must be 6-128 characters"),
];

// Threshold validation
const validateThresholds = [
  body("aman_max")
    .notEmpty().withMessage("aman_max is required")
    .isFloat({ min: 0, max: 10000 }).withMessage("aman_max must be a number between 0-10000"),
  body("waspada_max")
    .notEmpty().withMessage("waspada_max is required")
    .isFloat({ min: 0, max: 10000 }).withMessage("waspada_max must be a number between 0-10000"),
  body("siaga_max")
    .notEmpty().withMessage("siaga_max is required")
    .isFloat({ min: 0, max: 10000 }).withMessage("siaga_max must be a number between 0-10000"),
];

// Station info validation
const validateStationInfo = [
  body("name")
    .optional()
    .isString().withMessage("Name must be a string")
    .trim()
    .isLength({ max: 255 }).withMessage("Name too long"),
  body("type")
    .optional()
    .isString().withMessage("Type must be a string")
    .trim()
    .isLength({ max: 255 }).withMessage("Type too long"),
  body("description")
    .optional()
    .isString().withMessage("Description must be a string")
    .trim()
    .isLength({ max: 2000 }).withMessage("Description too long"),
  body("river")
    .optional()
    .isString().withMessage("River must be a string")
    .trim()
    .isLength({ max: 255 }).withMessage("River name too long"),
  body("location")
    .optional()
    .isString().withMessage("Location must be a string")
    .trim()
    .isLength({ max: 500 }).withMessage("Location too long"),
];

// Map coordinates validation
const validateMapCoordinates = [
  body("lat")
    .notEmpty().withMessage("Latitude is required")
    .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
  body("lng")
    .notEmpty().withMessage("Longitude is required")
    .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
  body("zoom")
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage("Zoom must be between 1 and 20"),
];

// Sensor config validation
const validateSensorConfig = [
  body("sensorHeight")
    .notEmpty().withMessage("Sensor height is required")
    .isFloat({ min: 0, max: 10000 }).withMessage("Sensor height must be between 0-10000"),
  body("offsetCm")
    .optional()
    .isFloat({ min: -1000, max: 1000 }).withMessage("Offset must be between -1000 and 1000"),
];

module.exports = {
  validateLogin,
  validateRegister,
  validateThresholds,
  validateStationInfo,
  validateMapCoordinates,
  validateSensorConfig,
};
