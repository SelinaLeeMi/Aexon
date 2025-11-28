/**
 * backend/scripts/readinessProbe.js
 *
 * Simple readiness probe for local/deploy testing. Checks:
 *  - MONGODB connectivity and ability to make a simple query
 *  - (Optional) REDIS connectivity if REDIS_URL present
 *  - uploads/kyc directory exists and is writeable
 *
 * Exit codes:
 *  0 = all good
 *  1 = minor non-fatal warnings (printed) but still OK
 *  2 = fatal failures (non-zero exit)
 *
 * Usage:
 *   node backend/scripts/readinessProbe.js
 *
 * This can be used in a container healthcheck or run locally before deploying.
 */

const dotenv = require("dotenv");
dotenv.config({ path: process.cwd() + "/backend/.env" });

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://localhost:27017/tradingdemo";
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS;
const uploadsDir = path.join(process.cwd(), "backend", "uploads", "kyc");

async function checkMongo() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 });
    // perform a quick server status
    const admin = new mongoose.mongo.Admin(mongoose.connection.db);
    const info = await admin.serverStatus();
    await mongoose.disconnect();
    return { ok: true, info: { version: info.version } };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

async function checkRedis() {
  if (!REDIS_URL) return { ok: true, skip: true };
  try {
    const IORedis = require("ioredis");
    const client = new IORedis(REDIS_URL, { connectTimeout: 3000 });
    await client.ping();
    await client.quit();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

async function checkUploads() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const testFile = path.join(uploadsDir, `.probe_${Date.now()}.tmp`);
    fs.writeFileSync(testFile, "probe");
    fs.unlinkSync(testFile);
    return { ok: true, path: uploadsDir };
  } catch (err) {
    return { ok: false, error: err.message || String(err), path: uploadsDir };
  }
}

(async function main() {
  console.log("[readinessProbe] Starting checks...");

  const results = {
    mongo: await checkMongo(),
    redis: await checkRedis(),
    uploads: await checkUploads(),
    env: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      REDIS_URL: !!process.env.REDIS_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV || "development",
    },
  };

  console.log(JSON.stringify(results, null, 2));

  // Determine exit code
  const fatal = [];
  if (!results.mongo.ok) fatal.push("mongo");
  if (!results.uploads.ok) fatal.push("uploads");
  if (results.redis && results.redis.ok === false) {
    // Redis is optional for demo; flag as warning but not fatal
    console.warn("[readinessProbe] Redis check failed (optional for demo):", results.redis.error);
  }
  if (fatal.length > 0) {
    console.error("[readinessProbe] FATAL checks failed:", fatal);
    process.exit(2);
  }

  console.log("[readinessProbe] All required checks passed.");
  process.exit(0);
})();