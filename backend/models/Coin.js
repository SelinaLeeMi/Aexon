/**
 * Coin Model - unified for static + custom coins
 */
const mongoose = require("mongoose");

const ChartPointSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  ts: { type: Number, required: true }
}, { _id: false });

const CoinSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: "" },

  // Prices
  price: { type: Number, default: 0 },
  previousPrice: { type: Number, default: 0 },

  // Chart history (capped in code)
  chartHistory: { type: [ChartPointSchema], default: [] },

  // If coin is added via admin UI
  isCustom: { type: Boolean, default: false },

  // Admin override control
  adminControlEnabled: { type: Boolean, default: false },
  targetPrice: { type: Number, default: null },
  driftSpeed: { type: Number, default: 0.03 }, // 0.01 - 0.10

  // housekeeping
  lastPriceUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Coin", CoinSchema);
