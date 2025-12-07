const mongoose = require("mongoose");

const candleSchema = new mongoose.Schema({
  time: Date,
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number
}, { _id: false });

const customCoinSchema = new mongoose.Schema({
  symbol:   { type: String, required: true, unique: true, uppercase: true },
  name:     { type: String, required: true },
  decimals: { type: Number, default: 18 },
  icon:     { type: String }, // /icons/custom/xxx.png

  price:        { type: Number, default: 0 },
  priceMode:    { type: String, enum: ["auto", "manual"], default: "manual" },
  targetPrice:  { type: Number },
  priceSpeed:   { type: Number, default: 0.2 },

  chart: [candleSchema],
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("CustomCoin", customCoinSchema);
