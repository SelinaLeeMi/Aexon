/**
 * backend/middlewares/adminAuth.js
 *
 * Strict admin JWT protection
 * - Accepts tokens issued with { userId }
 * - Verifies admin role
 * - Blocks banned users
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.SECRET ||
  "change_this_secret";

module.exports = async function adminAuth(req, res, next) {
  try {
    const authHeader =
      req.headers.authorization ||
      req.headers.Authorization ||
      "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // ✅ CRITICAL FIX — your backend issues userId
    const userId =
      payload.userId ||
      payload.id ||
      payload._id ||
      payload.sub;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const user = await User.findById(userId)
      .select("_id email username role isBanned")
      .lean();

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "User is banned" });
    }

    if ((user.role || "").toLowerCase() !== "admin") {
      return res.status(403).json({ error: "Admin role required" });
    }

    // Attach admin user (normalized)
    req.user = {
      _id: user._id,
      id: String(user._id),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error("adminAuth error:", err);
    return res.status(500).json({ error: "Authorization failure" });
  }
};
