/**
 * Coin Model - Professional, random/manual price simulation, candlesticks
 */
const mongoose = require("mongoose");

const candlestickSchema = new mongoose.Schema(
  {
    interval: { type: String, enum: ["1m", "5m", "30m", "1h", "1d"], required: true },
    data: [
      {
        time: { type: Date, required: true },
        open: Number,
        high: Number,
        low: Number,
        close: Number,
        volume: Number,
      },
    ],
  },
  { _id: false }
);

const coinSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, default: 1 },
    iconUrl: { type: String, default: "" },
    depositAddress: { type: String, default: "" },
    candlesticks: [candlestickSchema],
    // Professional simulation fields:
    targetPrice: { type: Number },
    priceMode: { type: String, enum: ["random", "manual"], default: "random" },
    priceTimerEnd: { type: Date },
    priceDirection: { type: String, enum: ["bull", "bear", "neutral"], default: "neutral" },
    lastPriceUpdate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coin", coinSchema);