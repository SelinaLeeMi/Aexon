/**
 * Auth Routes - Premium Professional Refactor (Fully Fixed & Updated)
 */
const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

// Registration
router.post("/register", auth.register);

// Confirm email
router.post("/confirm", auth.confirm);

// Login
router.post("/login", auth.login);

// Forgot password: send code
router.post("/forgot-password", auth.forgotPassword);

// Reset password with code
router.post("/reset-password", auth.resetPassword);

module.exports = router;