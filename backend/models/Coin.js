/**
 * Coin Model - unified for static + custom coins
 * - validation added for safety
 * - symbol index enforced (unique)
 */
const mongoose = require("mongoose");

const ChartPointSchema = new mongoose.Schema({
  price: { type: Number, required: true, min: 0 },
  ts: { type: Number, required: true }
}, { _id: false });

const CoinSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: "" },

  // Prices
  price: { type: Number, default: 0, min: 0 },
  previousPrice: { type: Number, default: 0, min: 0 },

  // Chart history (capped by code)
  chartHistory: { type: [ChartPointSchema], default: [] },

  // If coin is added via admin UI
  isCustom: { type: Boolean, default: false },

  // Admin override control
  adminControlEnabled: { type: Boolean, default: false },
  targetPrice: { type: Number, default: null },
  driftSpeed: { type: Number, default: 0.03, min: 0.001, max: 1.0 }, // validated range

  // housekeeping
  lastPriceUpdate: { type: Date, default: Date.now },
  marketCapRank: { type: Number, default: null }
}, { timestamps: true });

// ensure proper index on symbol
CoinSchema.index({ symbol: 1 }, { unique: true });

module.exports = mongoose.model("Coin", CoinSchema);