/**
 * admin.js (Express Router)
 *
 * Mount at app.use('/api/admin', adminAuth, adminRouter)
 *
 * This file preserves your original admin endpoints and adds
 * coin-management endpoints handled inline (no changes to adminController).
 *
 * Minimal additions:
 *  - GET /user/:id/balances  (ledger-backed, read-only)
 *  - POST /user/:id/deposit-address  (internal-only admin write, audited)
 *
 * All routes protected by adminAuth via router.use(adminAuth).
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
// NEW: Ledger-backed user balances (read-only)
// --------------------------
// Support both /user/:id/balances and /users/:id/balances for convenience
router.get('/user/:id/balances', adminController.getUserBalances.bind(adminController));
router.get('/users/:id/balances', adminController.getUserBalances.bind(adminController));

// --------------------------
// NEW: Admin-only deposit address setter (internal mapping only)
// --------------------------
// POST /api/admin/user/:id/deposit-address
// Body: { coin: "USDT", address: "internal-address-123" }
router.post('/user/:id/deposit-address', async (req, res) => {
  try {
    const userId = req.params.id;
    const coin = (req.body.coin || '').toUpperCase();
    const address = (req.body.address || '').trim();

    if (!userId || !coin || !address) {
      return res.status(400).json({ success: false, error: "Missing userId, coin or address" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    // Update (or create) wallet entry for this coin with the provided address.
    user.wallets = user.wallets || [];
    let wallet = user.wallets.find(w => w.coin === coin);
    if (!wallet) {
      wallet = { coin, balance: 0, address };
      user.wallets.push(wallet);
    } else {
      wallet.address = address;
    }

    await user.save();

    // Audit the admin action (do not log 'demo' or simulation wording)
    try {
      await createAudit("admin:set_deposit_address", req.user && req.user._id, {
        targetUser: userId, coin, address, performedAt: new Date()
      });
    } catch (e) {
      console.warn("audit create failed for deposit-address:", e && e.message);
    }

    return res.json({ success: true, msg: "Deposit address updated" });
  } catch (err) {
    console.error('Admin POST /user/:id/deposit-address error', err && (err.stack || err.message || err));
    return res.status(500).json({ success: false, error: 'Failed to set deposit address' });
  }
});

// --------------------------
// Existing coin management endpoints (unchanged)
// --------------------------

// List coins (with optional ?limit & ?skip)
router.get('/coins', async (req, res) => {
  try {
    const limit = Math.min(200, parseInt(req.query.limit || '100', 10));
    const skip = parseInt(req.query.skip || '0', 10);
    const q = {};
    if (req.query.symbol) q.symbol = (req.query.symbol || '').toUpperCase();
    const total = await Coin.countDocuments(q);
    const coins = await Coin.find(q).sort({ symbol: 1 }).skip(skip).limit(limit).lean();
    res.json({ success: true, total, data: coins });
  } catch (err) {
    console.error('Admin /coins list error', err);
    res.status(500).json({ success: false, error: 'Failed to list coins' });
  }
});

// Get single coin by symbol
router.get('/coins/:symbol', async (req, res) => {
  try {
    const symbol = (req.params.symbol || '').toUpperCase();
    const coin = await Coin.findOne({ symbol }).lean();
    if (!coin) return res.status(404).json({ success: false, error: 'Coin not found' });
    res.json({ success: true, data: coin });
  } catch (err) {
    console.error('Admin /coins/:symbol error', err);
    res.status(500).json({ success: false, error: 'Failed to get coin' });
  }
});

// Add new custom coin
router.post('/coins/add', async (req, res) => {
  try {
    const { symbol, name, icon, price, decimals } = req.body;
    if (!symbol || !name) return res.status(400).json({ success: false, error: 'symbol and name required' });

    const up = {
      symbol: symbol.toUpperCase(),
      name,
      icon: icon || '',
      price: typeof price === 'number' ? price : (price ? Number(price) : 0),
      previousPrice: typeof price === 'number' ? price : (price ? Number(price) : 0),
      chartHistory: [],
      isCustom: true,
      adminControlEnabled: true,
      targetPrice: typeof price === 'number' ? price : (price ? Number(price) : null),
      driftSpeed: 0.03,
      decimals: typeof decimals === 'number' ? decimals : (decimals ? Number(decimals) : 8)
    };

    const exists = await Coin.findOne({ symbol: up.symbol });
    if (exists) return res.status(400).json({ success: false, error: 'Coin already exists' });

    const coin = await Coin.create(up);
    res.json({ success: true, coin });
  } catch (err) {
    console.error('Admin /coins/add error', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to add coin' });
  }
});

// Update coin metadata (name/icon/decimals)
router.post('/coins/:symbol/update', async (req, res) => {
  try {
    const symbol = (req.params.symbol || '').toUpperCase();
    const { name, icon, decimals } = req.body;
    const coin = await Coin.findOne({ symbol });
    if (!coin) return res.status(404).json({ success: false, error: 'Coin not found' });

    if (name) coin.name = name;
    if (icon !== undefined) coin.icon = icon;
    if (decimals !== undefined) coin.decimals = decimals;
    await coin.save();
    res.json({ success: true, coin });
  } catch (err) {
    console.error('Admin /coins/:symbol/update error', err);
    res.status(500).json({ success: false, error: 'Failed to update coin' });
  }
});

// Set target price (admin override) and optional driftSpeed
router.post('/coins/:symbol/set-target', async (req, res) => {
  try {
    const symbol = (req.params.symbol || '').toUpperCase();
    const { targetPrice, driftSpeed } = req.body;
    if (targetPrice == null) return res.status(400).json({ success: false, error: 'targetPrice required' });

    const coin = await Coin.findOne({ symbol });
    if (!coin) return res.status(404).json({ success: false, error: 'Coin not found' });

    coin.adminControlEnabled = true;
    coin.targetPrice = Number(targetPrice);
    if (driftSpeed != null) coin.driftSpeed = Number(driftSpeed);
    await coin.save();

    res.json({ success: true, coin });
  } catch (err) {
    console.error('Admin /coins/:symbol/set-target error', err);
    res.status(500).json({ success: false, error: 'Failed to set target' });
  }
});

// Disable admin control for coin (resume normal pricing)
router.post('/coins/:symbol/disable-control', async (req, res) => {
  try {
    const symbol = (req.params.symbol || '').toUpperCase();
    const coin = await Coin.findOne({ symbol });
    if (!coin) return res.status(404).json({ success: false, error: 'Coin not found' });

    coin.adminControlEnabled = false;
    coin.targetPrice = null;
    await coin.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Admin /coins/:symbol/disable-control error', err);
    res.status(500).json({ success: false, error: 'Failed to disable control' });
  }
});

// Delete coin
router.delete('/coins/:symbol', async (req, res) => {
  try {
    const symbol = (req.params.symbol || '').toUpperCase();
    const result = await Coin.deleteOne({ symbol });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, error: 'Coin not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Admin DELETE /coins/:symbol error', err);
    res.status(500).json({ success: false, error: 'Failed to delete coin' });
  }
});

// Seed coins endpoint (dangerous — protected behind adminAuth)
router.post('/coins/seed', async (req, res) => {
  try {
    // Optional: pass { mode: "drop" } to clear collection first
    const coinsModule = require('../data/coins');
    if (req.body.mode === 'drop') {
      await Coin.deleteMany({});
    }

    // Upsert each coin so we don't duplicate
    const ops = coinsModule.map(c => ({
      updateOne: {
        filter: { symbol: c.symbol.toUpperCase() },
        update: {
          $setOnInsert: {
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            icon: c.icon || '',
            price: c.price || 0,
            previousPrice: c.previousPrice || (c.price || 0),
            chartHistory: c.chartHistory || [],
            isCustom: !!c.isCustom,
            adminControlEnabled: !!c.adminControlEnabled,
            targetPrice: c.targetPrice != null ? c.targetPrice : null,
            driftSpeed: typeof c.driftSpeed === 'number' ? c.driftSpeed : 0.03,
            decimals: typeof c.decimals === 'number' ? c.decimals : 8
          }
        },
        upsert: true
      }
    }));

    if (ops.length) await Coin.bulkWrite(ops);

    res.json({ success: true, inserted: ops.length });
  } catch (err) {
    console.error('Admin /coins/seed error', err);
    res.status(500).json({ success: false, error: 'Failed to seed coins' });
  }
});

// --------------------------
// Export router
// --------------------------
module.exports = router;