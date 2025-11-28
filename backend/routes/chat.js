/**
 * Chat Routes - Premium Professional Refactor
 */
const router = require("express").Router();
const { protect } = require("../middlewares/auth");
const { getMessages, sendMessage } = require("../controllers/chatController");

router.get("/", protect, getMessages);
router.post("/", protect, sendMessage);

module.exports = router;