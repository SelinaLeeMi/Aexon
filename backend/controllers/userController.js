/**
 * User Controller - Clean Final Version (No Auth Here)
 */
const User = require("../models/User");

// =====================
// GET /me (Profile)
// =====================
exports.me = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId)
      return res.status(401).json({ success: false, error: "Not authorized" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        balance: user.balance,
        avatar: user.avatar,
        wallets: user.wallets,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error: " + err.message });
  }
};

// =====================
// PATCH /username
// =====================
exports.updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.length < 3)
      return res.status(400).json({
        success: false,
        error: "Username must be at least 3 characters",
      });

    const exists = await User.findOne({ username });
    if (exists)
      return res
        .status(400)
        .json({ success: false, error: "Username already taken" });

    const userId = req.user?.id || req.user?._id;
    if (!userId)
      return res.status(401).json({ success: false, error: "Not authorized" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    user.username = username;
    await user.save();

    res.json({
      success: true,
      msg: "Username updated",
      data: { username: user.username },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error: " + err.message });
  }
};
