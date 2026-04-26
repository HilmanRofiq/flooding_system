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

// Middleware logger untuk melihat semua request yang masuk (sangat berguna untuk debug ESP32)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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

// Fallback route 404 (jika ESP salah kirim ke alamat yang tidak ada)
app.use((req, res) => {
  console.warn(`⚠️ Peringatan: Ada request ke rute yang tidak dikenal: ${req.method} ${req.originalUrl}`);
  res.status(404).send("Route not found");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
