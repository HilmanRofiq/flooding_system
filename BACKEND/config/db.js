const mongoose = require("mongoose");
const dns = require("dns");

// Force IPv4 DNS resolution to fix queryTxt ETIMEOUT
dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });
    console.log("MongoDB terkoneksi ✅");
  } catch (error) {
    console.error("MongoDB gagal ❌", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
