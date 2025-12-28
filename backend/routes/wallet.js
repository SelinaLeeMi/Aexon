/**
 * Wallet Routes - Premium Professional Refactor
 *
 * Routes:
 *  - GET /api/wallet           -> getWallet (embedded wallets array)
 *  - GET /api/wallet/summary   -> getWalletSummary (ledger-derived, price + total)
 *  - GET /api/wallet/transactions -> transaction history
 *  - POST /api/wallet/admin/set-balance -> adminSetBalance
 *  - POST /api/wallet/admin/set-deposit-address -> adminSetDepositAddress
 */
const router = require("express").Router();
const { protect, adminOnly } = require("../middlewares/auth");
const walletController = require("../controllers/walletController");

// User: get own wallet (embedded)
router.get("/", protect, walletController.getWallet);

// User: ledger-derived summary with prices
router.get("/summary", protect, walletController.getWalletSummary);

// User: transaction history with filter and pagination
router.get("/transactions", protect, walletController.listTransactions);

// Admin: set user balance
router.post("/admin/set-balance", protect, adminOnly, walletController.adminSetBalance);

// Admin: set deposit address for user
router.post("/admin/set-deposit-address", protect, adminOnly, walletController.adminSetDepositAddress);

module.exports = router;