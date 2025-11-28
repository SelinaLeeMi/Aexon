/**
 * Referral Controller - claim endpoint with double-claim protection, audit log
 */
const Referral = require("../models/Referral");
const User = require("../models/User");
const { createAudit } = require("../utils/auditLog");

exports.claimReferral = async (req, res) => {
  try {
    const { code } = req.body;
    const claimCode = (code || "").trim().toUpperCase();
    if (!claimCode) return res.status(400).json({ success: false, error: "Code required." });
    if (req.user.referralCode === claimCode)
      return res.status(400).json({ success: false, error: "Cannot claim your own code." });

    // Only allow one reward claim per user
    const previouslyClaimed = await Referral.findOne({ referred: req.user.id, rewardGiven: true });
    if (previouslyClaimed) return res.status(400).json({ success: false, error: "Already claimed referral." });

    // Validate referral code and prevent self-referral
    const referrer = await User.findOne({ referralCode: claimCode });
    if (!referrer) return res.status(404).json({ success: false, error: "Invalid code." });
    if (referrer._id.equals(req.user.id)) return res.status(400).json({ success: false, error: "Cannot claim your own code." });

    // Create referral entry, credit (sandbox logic: +10 demo credits)
    await Referral.create({
      referrer: referrer._id,
      referred: req.user.id,
      code: claimCode,
      rewardGiven: true,
    });
    referrer.balance += 10;
    await referrer.save();

    await createAudit("referral:claim", req.user.id, { code: claimCode, referrer: referrer._id });
    res.json({ success: true, msg: "Referral reward claimed!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};