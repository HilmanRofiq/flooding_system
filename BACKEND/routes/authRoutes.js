const express = require("express");
const router = express.Router();
const { login, register } = require("../controllers/authController");
const { validateLogin, validateRegister } = require("../utils/validators");
const verifyToken = require("../middlewares/auth");
const verifyAdmin = require("../middlewares/verifyAdmin");

// Public — admin login
router.post("/login", validateLogin, login);

// Admin only — register new admin user
router.post("/register", verifyToken, verifyAdmin, validateRegister, register);

module.exports = router;
