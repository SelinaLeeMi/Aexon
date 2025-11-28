/**
 * Wallet Routes - Premium Professional Refactor
 */
const router = require("express").Router();
const { protect, adminOnly } = require("../middlewares/auth");
const walletController = require("../controllers/walletController");

// User: get own wallet
router.get("/", protect, walletController.getWallet);

// User: transaction history with filter and pagination
router.get("/transactions", protect, walletController.listTransactions);

// Admin: set user balance
router.post("/admin/set-balance", protect, adminOnly, walletController.adminSetBalance);

// Admin: set deposit address for user
router.post("/admin/set-deposit-address", protect, adminOnly, walletController.adminSetDepositAddress);

module.exports = router;