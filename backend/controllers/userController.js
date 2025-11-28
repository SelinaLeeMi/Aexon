/**
 * User Controller - FIX JWT 'userId' bug and always use 'id'
 */
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "yourverysecurejwtsecret";

// Utility: always sign token with 'id' as string (NOT 'userId')
function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

exports.register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username)
      return res.status(400).json({ success: false, error: "All fields are required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, error: "Email already registered" });

    const existsUsername = await User.findOne({ username });
    if (existsUsername)
      return res.status(400).json({ success: false, error: "Username already taken" });

    const wallets = [];
    const balance = 0;

    const user = await User.create({ email, password, username, wallets, balance });
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      msg: "Registration successful",
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          balance: user.balance,
          avatar: user.avatar,
          wallets: user.wallets,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error: " + err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    const match = await user.comparePassword(password);
    if (!match)
      return res.status(400).json({ success: false, error: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      success: true,
      msg: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          balance: user.balance,
          avatar: user.avatar,
          wallets: user.wallets,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error: " + err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.user?.id?.toString() || req.user?._id?.toString();
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

exports.updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.length < 3)
      return res.status(400).json({ success: false, error: "Username must be at least 3 characters" });

    const exists = await User.findOne({ username });
    if (exists)
      return res.status(400).json({ success: false, error: "Username already taken" });

    const userId = req.user?.id?.toString() || req.user?._id?.toString();
    if (!userId)
      return res.status(401).json({ success: false, error: "Not authorized" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    user.username = username;
    await user.save();
    res.json({ success: true, msg: "Username updated", data: { username: user.username } });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error: " + err.message });
  }
};