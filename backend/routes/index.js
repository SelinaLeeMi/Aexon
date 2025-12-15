/**
 * Main API Route Index - Unified Routing (2025)
 * All backend feature routes register here.
 */

const express = require("express");
const router = express.Router();

// Import feature routers
const adminRouter = require("./admin");
const authRouter = require("./auth");
const userRouter = require("./user");
const coinRouter = require("./coin");
const announcementsRouter = require("./announcements");
const chatRouter = require("./chat");
const financeRouter = require("./finance");
const tradeRouter = require("./trade");
const futuresRouter = require("./futures");
const walletRouter = require("./wallet");
const kycRouter = require("./kyc");
const newsRouter = require("./news");
const referralRouter = require("./referral");

// Mount sub-routes
router.use("/admin", adminRouter);
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/coin", coinRouter);
router.use("/announcements", announcementsRouter);
router.use("/announcement", announcementsRouter); // legacy alias
router.use("/chat", chatRouter);
router.use("/finance", financeRouter);
router.use("/trade", tradeRouter);
router.use("/futures", futuresRouter);
router.use("/wallet", walletRouter);
router.use("/kyc", kycRouter);
router.use("/news", newsRouter);
router.use("/referral", referralRouter);

// USER deposit address lookup for currently authenticated user
// GET /api/user/deposit-address?coin=BTC&network=Mainnet
router.get("/user/deposit-address", async (req, res) => {
  try {
    // app.js attaches req.user when Bearer token present (lean user or payload)
    const user = req.user;
    if (!user || !user._id) return res.status(401).json({ success: false, error: "Not authenticated" });

    const coin = (req.query.coin || "").toString().toUpperCase();
    const network = (req.query.network || "").toString();

    if (!coin || !network) {
      return res.status(400).json({ success: false, error: "coin and network are required" });
    }

    // If req.user is a lean user document (from app middleware) it may already include depositAddresses
    // If not, fetch full user doc
    const User = require("../models/User");
    let userDoc = user;
    if (!user.depositAddresses) {
      userDoc = await User.findById(user._id).lean().exec();
    }

    const address = userDoc && userDoc.depositAddresses && userDoc.depositAddresses[coin] && userDoc.depositAddresses[coin][network];
    if (!address) {
      return res.status(404).json({ success: false, error: "Deposit address not assigned" });
    }
    return res.json({ success: true, address });
  } catch (err) {
    console.error("GET /user/deposit-address error:", err && (err.stack || err.message || err));
    return res.status(500).json({ success: false, error: "Failed to fetch deposit address" });
  }
});

// API root info
router.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Aexon API Gateway",
    endpoints: [
      "/api/auth/*",
      "/api/user/*",
      "/api/coin/*",
      "/api/announcements/*",
      "/api/chat/*",
      "/api/finance/*",
      "/api/trade/*",
      "/api/futures/*",
      "/api/wallet/*",
      "/api/kyc/*",
      "/api/news/*",
      "/api/referral/*",
      "/api/health"
    ],
    timestamp: Date.now()
  });
});

// Health (single definition)
router.get("/health", (req, res) =>
  res.status(200).json({
    ok: true,
    timestamp: Date.now(),
    env: process.env.NODE_ENV || "development"
  })
);

module.exports = router;