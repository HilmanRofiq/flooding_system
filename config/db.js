const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB terkoneksi ");
  } catch (error) {
    console.error("MongoDB gagal ", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
