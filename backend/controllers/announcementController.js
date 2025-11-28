/**
 * Announcement Controller — Professional Demo
 */
const Announcement = require("../models/Announcement");

/**
 * GET /api/announcements
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/announcements (admin only)
 */
exports.postAnnouncement = async (req, res) => {
  const { message, type } = req.body;
  const creator = req.user && req.user.id;
  const announcement = new Announcement({
    message,
    type: type || "info",
    createdBy: creator,
  });
  await announcement.save();
  res.status(201).json({ success: true, data: announcement });
};