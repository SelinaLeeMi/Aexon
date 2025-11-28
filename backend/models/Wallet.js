/**
 * Wallet Model
 * - Used to track deposit/withdrawal requests and internal credited balances.
 *
 * Fields:
 *  - user: reference to User._id
 *  - coin: symbol (uppercase)
 *  - amount: numeric
 *  - address: onchain address (if deposit/withdraw)
 *  - tx: transaction hash (optional)
 *  - status: pending|approved|rejected
 *  - reason: rejection reason
 *  - processedBy: admin id
 *  - processedAt: date
 *  - createdAt, updatedAt (timestamps)
 */
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    coin: { type: String, required: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    address: { type: String, default: "" },
    tx: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reason: { type: String, default: "" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);