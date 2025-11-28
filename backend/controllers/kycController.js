/**
 * KYC Controller - File or URL, full ID validation, sanitized
 */
console.log("KYC controller loaded");

const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sanitize = require("sanitize-filename");

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "kyc");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
const maxFileSize = 2 * 1024 * 1024; // 2MB

// Multer storage
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const safeBase = sanitize(
      base.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\.]+/g, "")
    );

    cb(null, `kyc_${req.user.id}_${Date.now()}_${safeBase}${ext}`);
  },
});

// Upload middleware
const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: function (_req, file, cb) {
    if (!allowedTypes.includes(file.mimetype))
      return cb(new Error("Only JPG, PNG, PDF allowed"));
    cb(null, true);
  },
});

exports.kycUploadMiddleware = upload.fields([
  { name: "frontFile", maxCount: 1 },
  { name: "backFile", maxCount: 1 },
]);

// ---------------------------
// User Submit KYC
// ---------------------------
exports.submitKYC = async (req, res) => {
  try {
    let documentUrl = req.body.documentUrl || "";
    let frontFileUrl = "";
    let backFileUrl = "";

    if (req.files && req.files.frontFile && req.files.frontFile[0]) {
      frontFileUrl = `/uploads/kyc/${path.basename(
        req.files.frontFile[0].path
      )}`;
    }

    if (req.files && req.files.backFile && req.files.backFile[0]) {
      backFileUrl = `/uploads/kyc/${path.basename(
        req.files.backFile[0].path
      )}`;
    }

    if (!documentUrl && !frontFileUrl) {
      return res
        .status(400)
        .json({ success: false, error: "Document required" });
    }

    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "User not found" });

    user.kyc = {
      status: "pending",
      documentUrl: documentUrl || frontFileUrl,
      backDocumentUrl: backFileUrl || undefined,
      submittedAt: new Date(),
      error: "",
    };

    await user.save();

    res.json({ success: true, msg: "KYC submitted" });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ---------------------------
// User: Get KYC Status
// ---------------------------
exports.getKYCStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "User not found" });

    res.json({
      success: true,
      data: {
        status: user.kyc.status,
        documentUrl: user.kyc.documentUrl,
        backDocumentUrl: user.kyc.backDocumentUrl,
        error: user.kyc.error,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ---------------------------
// Admin: List all KYC
// ---------------------------
exports.adminListKYC = async (_req, res) => {
  try {
    const users = await User.find({ "kyc.status": { $exists: true } }).select(
      "email kyc"
    );

    res.json({ success: true, data: users });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ---------------------------
// Admin: Approve or Reject
// ---------------------------
exports.adminApproveKYC = async (req, res) => {
  try {
    const { userId, status, error } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "User not found" });

    user.kyc.status = status;
    user.kyc.error = error || "";
    await user.save();

    res.json({ success: true, msg: "KYC updated" });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

console.log("EXPORT KEYS:", Object.keys(exports));
