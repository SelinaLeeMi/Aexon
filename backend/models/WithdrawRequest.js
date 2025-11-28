/**
 * WithdrawRequest Model - Demo Withdraw Workflow
 */
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const withdrawRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coin: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.00000001 },
    address: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    note: { type: String, default: "" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);