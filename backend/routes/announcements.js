/**
 * Announcements Routes - Professional Demo with integrated validations and audit log
 */
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middlewares/auth");
const { validateAnnouncement } = require("../middlewares/validators");
const logger = require("../utils/logger");
const announcementController = require("../controllers/announcementController");

// GET /api/announcements (all users, auth required for demo purposes)
router.get("/", protect, announcementController.getAnnouncements);

// POST /api/announcements (admin only)
router.post("/", protect, adminOnly, validateAnnouncement, async (req, res, next) => {
  try {
    const result = await announcementController.postAnnouncement(req, res);
    logger.info("Admin posted announcement", { adminId: req.user.id, body: req.body });
    return result;
  } catch (err) {
    next(err);
  }
});

module.exports = router;