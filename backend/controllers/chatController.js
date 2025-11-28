/**
 * Chat Controller - Professional Refactor
 * Features: Input validation, standardized response, clean structure
 */
const ChatMessage = require("../models/ChatMessage");

// Get all chat messages (latest 50)
exports.getMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user", "email role");
    res.json({
      success: true,
      msg: "Fetched chat messages",
      data: messages.reverse(), // oldest first
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
};

// Send new chat message (user or admin)
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.length < 1)
      return res.status(400).json({
        success: false,
        error: "Message required",
      });
    const chatMsg = await ChatMessage.create({ user: req.user.id, message });
    res.status(201).json({
      success: true,
      msg: "Message sent",
      data: chatMsg,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
};