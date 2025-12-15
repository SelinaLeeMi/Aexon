/**
 * admin.js (Express Router)
 *
 * Mount at app.use('/api/admin', adminAuth, adminRouter)
 *
 * This file preserves your original admin endpoints and adds
 * coin-management endpoints handled inline (no changes to adminController).
 *
 * Updated deposit-address admin endpoint to accept { coin, network, address }
 * and store the value under user.depositAddresses[coin][network] = address
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuth');

const Coin = require('../models/Coin');
const User = require('../models/User');
const { createAudit } = require('../utils/auditLog');

// Protect all admin routes
router.use(adminAuth);

// --------------------------
// Existing admin routes
// --------------------------
// Summary
router.get('/summary', adminController.getSummary.bind(adminController));

// Users
router.get('/users', adminController.listUsers.bind(adminController));
router.post('/user/:id/action', adminController.userAction.bind(adminController));
router.post('/user/:id/adjust-balance', adminController.adjustBalance.bind(adminController));

// Wallets
router.get('/wallets', adminController.listWallets.bind(adminController));
router.post('/wallets/:id/approve', adminController.approveWallet.bind(adminController));
router.post('/wallets/:id/reject', adminController.rejectWallet.bind(adminController));

// Trades
router.get('/trades', adminController.listTrades.bind(adminController));
router.post('/trades/:id/cancel', adminController.cancelTrade.bind(adminController));

// Broadcast & Price override
router.post('/broadcast', adminController.broadcast.bind(adminController));
router.post('/price_override', adminController.priceOverride.bind(adminController));

// Logs & Settings
router.get('/logs', adminController.getLogs.bind(adminController));
router.get('/settings', adminController.getSettings.bind(adminController));
router.post('/settings', adminController.postSettings.bind(adminController));

// --------------------------
// NEW/UPDATED: Admin-only deposit address setter (internal mapping only)
// --------------------------
// POST /api/admin/user/:id/deposit-address
// Body: { coin, network, address }
// Stores on User.depositAddresses[coin][network] = address
// Only admin-authenticated callers may use this.
router.post('/user/:id/deposit-address', async (req, res) => {
  try {
    const userId = req.params.id;
    const coinRaw = req.body.coin;
    const network = (req.body.network || '').toString().trim();
    const address = (req.body.address || '').toString().trim();

    if (!userId || !coinRaw || !network || !address) {
      return res.status(400).json({ success: false, error: "userId, coin, network and address are required" });
    }

    const coin = String(coinRaw).toUpperCase();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    // Ensure depositAddresses structure exists
    user.depositAddresses = user.depositAddresses || {};
    if (typeof user.depositAddresses !== 'object') user.depositAddresses = {};

    if (!user.depositAddresses[coin] || typeof user.depositAddresses[coin] !== 'object') {
      user.depositAddresses[coin] = {};
    }

    user.depositAddresses[coin][network] = address;
    await user.save();

    // Audit the admin action
    try {
      await createAudit("admin:set_deposit_address", req.user && req.user._id, {
        targetUser: userId,
        coin,
        network,
        performedAt: new Date()
      });
    } catch (e) {
      console.warn("audit create failed for deposit-address:", e && e.message);
    }

    return res.json({ success: true, msg: "Deposit address saved" });
  } catch (err) {
    console.error('Admin POST /user/:id/deposit-address error', err && (err.stack || err.message || err));
    return res.status(500).json({ success: false, error: 'Failed to set deposit address' });
  }
});

// --------------------------
// Existing coin management endpoints (unchanged) ...
// (Rest of file unchanged)
module.exports = router;