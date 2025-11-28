/**
 * Referral Model - Premium Refactor
 */
const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referred: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    joinedAt: { type: Date, default: Date.now },
    rewardGiven: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", referralSchema);