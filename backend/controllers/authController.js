/**
 * Auth Controller - Unified Registration, Confirmation, Login, and Password Reset
 */

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendConfirmationCode, sendPasswordResetCode } = require("../utils/email");

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Generate random 6-digit code
function randomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- Registration ---
exports.register = async (req, res) => {
  try {
    const { email, password, referralCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required.", code: "MISSING_FIELDS" });
    }

    let user = await User.findOne({ email });
    if (user) {
      if (!user.emailVerified) {
        // Email exists but not verified: resend code
        const code = randomCode();
        user.verificationCode = code;
        user.verificationCodeExpires = Date.now() + 15 * 60 * 1000; // 15 min as timestamp
        await user.save();
        try {
          await sendConfirmationCode(email, code);
        } catch (err) {
          return res.status(500).json({ success: false, error: "Failed to send verification code. Please try again.", code: "EMAIL_SEND_FAILED" });
        }
        return res.status(200).json({
          success: false,
          error: "Account exists but not verified. Verification code resent to your email.",
          code: "EMAIL_NOT_VERIFIED",
          userId: user._id,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "This email is already registered and verified. Please log in or reset your password.",
          code: "EMAIL_ALREADY_REGISTERED"
        });
      }
    }

    // New user registration
    const code = randomCode();
    const userData = {
      email,
      password,
      emailVerified: false,
      verificationCode: code,
      verificationCodeExpires: Date.now() + 15 * 60 * 1000,
      username: "aexonuser_" + Math.random().toString(36).substring(2, 8),
      referralCode: referralCode && referralCode.trim() !== "" ? referralCode.trim() : undefined
    };

    user = await User.create(userData);
    try {
      await sendConfirmationCode(email, code);
    } catch (err) {
      return res.status(500).json({ success: false, error: "Failed to send verification code. Please try again.", code: "EMAIL_SEND_FAILED" });
    }
    res.json({
      success: true,
      msg: "Verification code sent to your email.",
      userId: user._id
    });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "This email is already registered. Please log in or reset your password.",
        code: "EMAIL_ALREADY_REGISTERED"
      });
    }
    res.status(500).json({ success: false, error: "Registration failed: " + e.message, code: "REGISTRATION_FAILED" });
  }
};

// --- Confirm Email ---
exports.confirm = async (req, res) => {
  const { userId, code } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid user.", code: "INVALID_USER" });
    }
    if (user.emailVerified) {
      return res.status(400).json({ success: false, error: "This account is already verified. Please log in.", code: "ALREADY_VERIFIED" });
    }
    if (
      user.verificationCode !== code ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < Date.now()
    ) {
      return res.status(400).json({ success: false, error: "Invalid or expired confirmation code.", code: "INVALID_CODE" });
    }
    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();
    res.json({ success: true, msg: "Your email is verified. You can now log in." });
  } catch (e) {
    res.status(500).json({ success: false, error: "Email confirmation failed: " + e.message, code: "CONFIRM_FAILED" });
  }
};

// --- Login (only if verified) ---
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: "No account found with this email.", code: "NO_ACCOUNT" });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ success: false, error: "Wrong password.", code: "WRONG_PASSWORD" });
    }
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        error: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
        userId: user._id
      });
    }
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      success: true,
      token,
      user: {
        email: user.email,
        _id: user._id,
        username: user.username
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Login failed: " + err.message, code: "LOGIN_FAILED" });
  }
};

// --- Forgot Password: send code ---
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal email existence for privacy
      return res.json({ success: true, msg: "If your email is registered, a reset code has been sent." });
    }
    const code = randomCode();
    user.verificationCode = code;
    user.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
    await user.save();
    try {
      await sendPasswordResetCode(email, code);
    } catch (err) {
      return res.status(500).json({ success: false, error: "Failed to send password reset code. Please try again.", code: "EMAIL_SEND_FAILED" });
    }
    res.json({ success: true, msg: "If your email is registered, a reset code has been sent." });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to send password reset code.", code: "FORGOT_FAILED" });
  }
};

// --- Reset Password With Code ---
exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid email.", code: "INVALID_EMAIL" });
    }
    if (
      user.verificationCode !== code ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < Date.now()
    ) {
      return res.status(400).json({ success: false, error: "Invalid or expired reset code.", code: "INVALID_CODE" });
    }
    user.password = newPassword;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();
    res.json({ success: true, msg: "Password reset successful. You can now log in." });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to reset password.", code: "RESET_FAILED" });
  }
};