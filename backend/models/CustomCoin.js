const mongoose = require("mongoose");

const candleSchema = new mongoose.Schema({
  time: { type: Date, default: Date.now },
  open: { type: Number, default: 0 },
  high: { type: Number, default: 0 },
  low: { type: Number, default: 0 },
  close: { type: Number, default: 0 },
  volume: { type: Number, default: 0 }
}, { _id: false });

const customCoinSchema = new mongoose.Schema({
  symbol:   { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:     { type: String, required: true, trim: true },
  decimals: { type: Number, default: 18 },
  icon:     { type: String, default: "" }, // /icons/custom/xxx.png

  price:        { type: Number, default: 0, min: 0 },
  priceMode:    { type: String, enum: ["auto", "manual", "random"], default: "manual" },
  targetPrice:  { type: Number, default: null },
  priceSpeed:   { type: Number, default: 0.2, min: 0, max: 1 },

  // Price scheduling for manual modes
  priceTimerEnd: { type: Date, default: null },
  priceDirection: { type: String, enum: ["bull", "bear", "neutral"], default: "neutral" },

  // Candlesticks / chart
  candlesticks: { type: [candleSchema], default: [] },

  // housekeeping
  lastPriceUpdate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure symbol uniqueness index
customCoinSchema.index({ symbol: 1 }, { unique: true });

module.exports = mongoose.model("CustomCoin", customCoinSchema);