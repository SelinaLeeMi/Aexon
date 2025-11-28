/**
 * Auth Middlewares - Foolproof JWT Fix
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "yourverysecurejwtsecret";

/**
 * Middleware to protect routes (JWT required).
 * Accepts either 'userId' or 'id' in JWT payload for compatibility.
 */
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "No token. Unauthorized." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Accept userId or id for compatibility
    const userId =
      decoded.userId?.toString() ||
      decoded.id?.toString() ||
      null;

    // DEBUG: show payload if missing userId/id
    if (!userId) {
      console.error("JWT payload missing 'userId' or 'id':", decoded);
      return res
        .status(401)
        .json({ success: false, error: "Token does not include user id." });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "User not found." });
    }
    if (user.isBanned) {
      return res
        .status(403)
        .json({ success: false, error: "Account banned. Please contact support." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: "Token invalid or expired." });
  }
};

/**
 * Middleware to restrict access to admins only.
 * User must be authenticated and have 'admin' role.
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, error: "Not authenticated." });
  }
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, error: "Admins only." });
  }
  if (req.user.isBanned) {
    return res
      .status(403)
      .json({ success: false, error: "Admin account banned." });
  }
  next();
};

module.exports = { protect, adminOnly };