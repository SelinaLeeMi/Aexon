/**
 * LedgerEntry - Immutable Account Transactions: Source-of-truth
 */
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ledgerEntrySchema = new Schema(
  {
    user:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:      { type: String, enum: ['deposit', 'withdraw', 'trade', 'fee', 'adjustment', 'referral'], required: true },
    subtype:   { type: String }, // optional: BUY/SELL for trades, admin for adjustments
    ref:       { type: String }, // external reference (trade id, request id, etc.)
    coin:      { type: String, required: true },
    amount:    { type: Number, required: true },
    balance:   { type: Number, required: true }, // Wallet balance after transaction
    note:      { type: String, default: "" },
    meta:      { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now }
  }
);

ledgerEntrySchema.index({ user: 1, coin: 1, createdAt: 1 });

module.exports = mongoose.model("LedgerEntry", ledgerEntrySchema);