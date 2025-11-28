/**
 * Main API Route Index - Professional and Complete!
 * All backend feature routes are centrally registered here.
 * Add new feature modules below (DO NOT skip this file).
 */

const express = require("express");
const router = express.Router();

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

router.use("/admin", adminRouter);
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/coin", coinRouter);
router.use("/announcements", announcementsRouter);
router.use("/announcement", announcementsRouter); // alias for backwards-compat
router.use("/chat", chatRouter);
router.use("/finance", financeRouter);
router.use("/trade", tradeRouter);
router.use("/futures", futuresRouter);
router.use("/wallet", walletRouter);
router.use("/kyc", kycRouter);
router.use("/news", newsRouter);
router.use("/referral", referralRouter);

router.get("/health", (req, res) =>
  res.status(200).json({ ok: true, timestamp: Date.now(), env: process.env.NODE_ENV || "development" })
);

module.exports = router;