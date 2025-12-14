/**
 * Idempotent coin loader
 *
 * Reads backend/data/coins.js and upserts each coin by symbol.
 * - Updates canonical fields (name, icon, previousPrice) for existing coins
 * - Does not overwrite admin-controlled fields or historical data
 *
 * Usage:
 *   MONGO_URI="mongodb://127.0.0.1:27017/aexon" node scripts/loadCoins.js
 *
 * Exits with 0 on success, 1 on error.
 */

const mongoose = require("mongoose");
const Coin = require("../models/Coin");
const coins = require("../data/coins");
require("dotenv").config();
const path = require("path");

async function start() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    "mongodb://127.0.0.1:27017/aexon";

  console.log("Connecting to database:", uri);

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  } catch (err) {
    console.error("MongoDB connection error:", err && (err.stack || err));
    process.exit(1);
  }

  try {
    if (!Array.isArray(coins) || coins.length === 0) {
      console.error("No coins found in backend/data/coins.js");
      await mongoose.disconnect();
      process.exit(1);
    }

    // Prepare bulk ops: upsert by symbol (uppercase)
    const ops = coins.map((c) => {
      const symbol = String(c.symbol || "").toUpperCase().trim();
      const name = String(c.name || "").trim();
      const icon = c.icon || "";
      const previousPrice = Number(c.previousPrice != null ? c.previousPrice : (c.price || 0));
      const price = Number(c.price || 0);

      // Only set price if provided and positive when inserting or when existing price is zero.
      return {
        updateOne: {
          filter: { symbol },
          update: {
            $set: {
              name,
              icon,
              previousPrice
            },
            $setOnInsert: {
              price: price || 0,
              chartHistory: [],
              isCustom: false,
              adminControlEnabled: false,
              targetPrice: null,
              driftSpeed: 0.03,
              lastPriceUpdate: new Date()
            },
            // Do not overwrite admin-controlled fields on existing documents
          },
          upsert: true
        }
      };
    });

    console.log("Running bulk upsert for", ops.length, "coins...");
    const result = await Coin.bulkWrite(ops, { ordered: false });

    const upserted = (result.upsertedCount || 0);
    const modified = (result.modifiedCount || 0);
    console.log(`Bulk operation complete. upserted: ${upserted}, modified: ${modified}`);

    // Optional: report total count in DB
    const total = await Coin.countDocuments();
    console.log("Total coins in DB:", total);

    await mongoose.disconnect();
    console.log("Disconnected. Load coins finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Load coins error:", err && (err.stack || err));
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

start();