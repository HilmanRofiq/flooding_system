require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

// CONNECT DB
connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server monitoring banjir aktif 🚀");
});

const sensorRoutes = require("./routes/sensorRoutes");
app.use("/api", sensorRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const floodRoutes = require("./routes/floodRoutes");
app.use("/", floodRoutes);

