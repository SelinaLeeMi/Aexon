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
