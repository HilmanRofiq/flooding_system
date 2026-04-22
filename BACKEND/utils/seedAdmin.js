/**
 * Seed Admin User Script
 * Run: node utils/seedAdmin.js
 * 
 * Creates the first admin user for the flooding system.
 * CHANGE THE PASSWORD AFTER FIRST LOGIN!
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dns = require("dns");

// Force IPv4
dns.setDefaultResultOrder("ipv4first");

const User = require("../models/User");

const DEFAULT_ADMIN = {
  name: "Admin",
  email: "admin@flood.com",
  password: "admin123",
};

async function seedAdmin() {
  console.log("=== Seed Admin User ===\n");

  if (!process.env.MONGO_URI) {
    console.error("ERROR: MONGO_URI not set in .env");
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error("ERROR: JWT_SECRET not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log("Connected to MongoDB\n");

    // Check if admin already exists
    const existing = await User.findOne({ email: DEFAULT_ADMIN.email });
    if (existing) {
      console.log(`Admin user already exists: ${existing.email}`);
      console.log("No changes made.");
      process.exit(0);
    }

    // Create admin
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    const admin = await User.create({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      isAdmin: true,
      isActive: true,
    });

    console.log("Admin user created successfully!");
    console.log(`  Name  : ${admin.name}`);
    console.log(`  Email : ${admin.email}`);
    console.log(`  Pass  : ${DEFAULT_ADMIN.password}`);
    console.log("\n⚠️  CHANGE THE PASSWORD AFTER FIRST LOGIN!\n");

  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
