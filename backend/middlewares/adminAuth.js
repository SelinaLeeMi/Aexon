/**
 * adminAuth.js
 *
 * Middleware to protect admin routes using JWT and User model.
 * - Verifies JWT_SECRET and checks user role === 'admin' and not banned (isBanned).
 *
 * Expects token payload to contain user id in "id", "_id" or "sub".
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET || "change_this_secret";

module.exports = async function adminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || "";
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
    const token = auth.split(" ")[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = payload.id || payload._id || payload.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const user = await User.findById(userId).select('+role +isBanned +email +username').lean();
    if (!user) return res.status(401).json({ error: "User not found" });

    if ((user.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ error: "Admin role required" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "User is banned" });
    }

    // attach concise user info to req
    req.user = { _id: user._id, email: user.email, username: user.username, role: user.role };
    next();
  } catch (err) {
    console.error("adminAuth error:", err && (err.stack || err.message || err));
    return res.status(500).json({ error: "Authorization failure" });
  }
};