/**
 * KYC Routes - With size/type checks, Joi validation, and static serving
 */
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middlewares/auth");
const kycCtrl = require("../controllers/kycController");
const { validateKycSubmission } = require("../middlewares/validators");
const { sensitiveLimiter } = require("../middlewares/rateLimit");

// User submits KYC (file or documentUrl)
router.post(
  "/submit",
  protect,
  sensitiveLimiter,
  kycCtrl.kycUploadMiddleware,
  validateKycSubmission,
  kycCtrl.submitKYC
);

// User checks KYC status
router.get("/status", protect, kycCtrl.getKYCStatus);

// Admin: List all pending KYC
router.get("/admin/list", protect, adminOnly, kycCtrl.adminListKYC);

// Admin: Approve/reject
router.post("/admin/approve", protect, adminOnly, kycCtrl.adminApproveKYC);

module.exports = router;