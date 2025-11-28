/**
 * backend/scripts/seedAdmin.js
 *
 * Usage:
 *   # locally (ensure backend/.env exists or env vars are set)
 *   node backend/scripts/seedAdmin.js
 *
 * This script will:
 *  - connect to MONGODB_URI
 *  - create an admin user if none exists with the ADMIN_EMAIL or default
 *  - if user exists it will ensure role=admin and optionally update password if ADMIN_PASSWORD is provided
 *  - output the created/updated admin details and a JWT token to use for admin requests (DEV only)
 *
 * IMPORTANT:
 *  - This prints sensitive info (password and token) to stdout for convenience in local/dev.
 *  - Do NOT run this in a production environment where stdout is publicly accessible.
 *  - Use a secure password in production via the ADMIN_PASSWORD env var or set the admin via your admin UI.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const crypto = require("crypto");
dotenv.config({ path: process.cwd() + "/backend/.env" });

const User = require("../models/User");
const jwt = require("jsonwebtoken");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://localhost:27017/tradingdemo";
const JWT_SECRET = process.env.JWT_SECRET || "change_this_jwt_secret";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || null;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";

async function connect() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

/**
 * Generate a secure random password for local/dev use
 */
function randomPassword() {
  return crypto.randomBytes(8).toString("base64").replace(/\W/g, "A").slice(0, 12);
}

async function run() {
  try {
    console.log("[seedAdmin] Connecting to MongoDB...");
    await connect();
    console.log("[seedAdmin] Connected.");

    let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    const usedPassword = ADMIN_PASSWORD || randomPassword();
    if (!admin) {
      console.log(`[seedAdmin] No admin found for ${ADMIN_EMAIL}. Creating new admin user...`);
      const newUser = new User({
        email: ADMIN_EMAIL.toLowerCase(),
        password: usedPassword,
        username: ADMIN_USERNAME,
        role: "admin",
        isVerified: true,
      });
      await newUser.save();
      admin = newUser;
      console.log("[seedAdmin] Admin created.");
    } else {
      let changed = false;
      if (admin.role !== "admin") {
        admin.role = "admin";
        changed = true;
      }
      if (ADMIN_PASSWORD) {
        admin.password = ADMIN_PASSWORD;
        changed = true;
      }
      if (changed) {
        await admin.save();
        console.log("[seedAdmin] Existing user updated to admin (and password overwritten if ADMIN_PASSWORD provided).");
      } else {
        console.log("[seedAdmin] Admin user already exists and unchanged.");
      }
    }

    // Create JWT token for convenience (dev only)
    const payload = { id: admin._id.toString(), role: admin.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "14d" });

    console.log("========================================");
    console.log("ADMIN SEED COMPLETE (DEV ONLY)");
    console.log(`email: ${admin.email}`);
    console.log(`id   : ${admin._id}`);
    if (ADMIN_PASSWORD) {
      console.log("password: (provided via ADMIN_PASSWORD)");
    } else {
      console.log(`password: ${usedPassword} (auto-generated)`);
    }
    console.log("");
    console.log("Use this JWT for admin API calls (development convenience):");
    console.log(token);
    console.log("========================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[seedAdmin] ERROR:", err && err.stack ? err.stack : err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(2);
  }
}

run();