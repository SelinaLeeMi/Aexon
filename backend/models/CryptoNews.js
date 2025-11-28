/**
 * CryptoNews Model - Premium Refactor
 */
const mongoose = require("mongoose");

const cryptoNewsSchema = new mongoose.Schema(
  {
    headline: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CryptoNews", cryptoNewsSchema);