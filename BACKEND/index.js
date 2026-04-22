require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CHECK REQUIRED ENV =====
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in .env");
  process.exit(1);
}

// CONNECT DB
connectDB();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server monitoring banjir aktif");
});

// ===== ROUTES =====

// Auth routes (login, register)
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Admin routes (settings, export) — protected
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// Public settings (thresholds, station info, map coords)
const settingsRoutes = require("./routes/settingsRoutes");
app.use("/api/settings", settingsRoutes);

// Sensor data routes (public read + ESP write)
const sensorRoutes = require("./routes/sensorRoutes");
app.use("/api", sensorRoutes);

// Flood data route (ESP sensor POST)
const floodRoutes = require("./routes/floodRoutes");
app.use("/", floodRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
