/**
 * Finance Routes - With ledger, audit, validation, and rate limit
 */
const router = require("express").Router();
const finance = require("../controllers/financeController");
const { protect, adminOnly } = require("../middlewares/auth");
const { validateDepositWithdraw } = require("../middlewares/validators");
const { sensitiveLimiter } = require("../middlewares/rateLimit");

// User: create deposit/withdraw request
router.post("/deposit", protect, sensitiveLimiter, validateDepositWithdraw, finance.requestDeposit);
router.post("/withdraw", protect, sensitiveLimiter, validateDepositWithdraw, finance.requestWithdraw);

// User: list own requests
router.get("/my-deposits", protect, finance.myDeposits);
router.get("/my-withdrawals", protect, finance.myWithdrawals);

// Admin endpoints: approve/reject
router.post("/admin/deposit/:id/approve", protect, adminOnly, finance.adminApproveDeposit);
router.post("/admin/deposit/:id/reject", protect, adminOnly, finance.adminRejectDeposit);
router.post("/admin/withdraw/:id/approve", protect, adminOnly, finance.adminApproveWithdraw);
router.post("/admin/withdraw/:id/reject", protect, adminOnly, finance.adminRejectWithdraw);

module.exports = router;