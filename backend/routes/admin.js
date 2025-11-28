/**
 * admin.js (Express Router)
 *
 * Mount at app.use('/api/admin', adminAuth, adminRouter)
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuth');

// Protect all admin routes
router.use(adminAuth);

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

module.exports = router;