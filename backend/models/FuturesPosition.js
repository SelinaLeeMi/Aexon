/**
 * FuturesPosition Model - Premium Refactor
 */
const mongoose = require("mongoose");

const futuresPositionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pair: { type: String, required: true, trim: true },
    direction: { type: String, enum: ["long", "short"], required: true },
    amount: { type: Number, required: true, min: 0 },
    leverage: { type: Number, required: true, min: 1 },
    entryPrice: { type: Number, required: true },
    tp: { type: Number },
    sl: { type: Number },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    closedPrice: { type: Number },
    pnl: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FuturesPosition", futuresPositionSchema);