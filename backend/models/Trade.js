/**
 * Trade Model - Premium Refactor
 */
const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pair: { type: String, required: true, trim: true },
    type: { type: String, enum: ["buy", "sell"], required: true },
    amount: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trade", tradeSchema);