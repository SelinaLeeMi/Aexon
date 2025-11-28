/**
 * Admin endpoints - extended for full integrity, management, and deployment readiness.
 * Includes all verification, ban/unban, promote/demote, user/wallet/trade management, price/broadcast, logging, settings.
 */
const path = require('path');
const fs = require('fs');
const { broadcast } = require('../utils/broadcaster');

// Models
const User = require('../models/User');
const Coin = require('../models/Coin');
const Trade = require('../models/Trade');
const Wallet = require('../models/Wallet');
const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');
const DepositRequest = require("../models/DepositRequest");
const WithdrawRequest = require("../models/WithdrawRequest");

async function createAudit(action, actorId, details = {}) {
  try {
    if (!AuditLog) return;
    await AuditLog.create({ action, actor: actorId, details, createdAt: new Date() });
  } catch (e) {
    console.warn("createAudit failed:", e && (e.message || e));
  }
}

module.exports = {
  // GET /admin/summary
  async getSummary(req, res) {
    try {
      const usersCount = await User.countDocuments({});
      const openTrades = Trade ? await Trade.countDocuments({ status: 'open' }) : 0;
      const pendingWallets = Wallet ? await Wallet.countDocuments({ status: 'pending' }) : 0;
      const wsClients = (global.io && global.io.sockets) ? (global.io.sockets.sockets ? Object.keys(global.io.sockets.sockets).length : 0) : 0;

      return res.json({ success: true, data: { users: usersCount, openTrades, pendingWallets, wsClients } });
    } catch (e) {
      console.error("getSummary error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to compute summary" });
    }
  },

  // GET /admin/users?search=
  async listUsers(req, res) {
    try {
      const q = (req.query.search || "").trim();
      const filter = {};
      if (q) {
        const regex = new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
        filter.$or = [{ username: regex }, { email: regex }, { _id: regex }];
      }
      const users = await User.find(filter).limit(500).lean();
      const normalized = users.map(u => {
        const wallets = Array.isArray(u.wallets) ? u.wallets : [];
        const balanceSummary = wallets.slice(0, 5).map(w => `${w.coin}:${w.balance}`).join(', ');
        return { ...u, balanceSummary, wallets };
      });
      return res.json({ success: true, data: normalized });
    } catch (e) {
      console.error("listUsers error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to list users" });
    }
  },

  // POST /admin/user/:id/action
  async userAction(req, res) {
    try {
      const { id } = req.params;
      const { action } = req.body;
      if (!id || !action) return res.status(400).json({ error: "Missing id or action" });

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (action === "ban") {
        user.isBanned = true;
      } else if (action === "unban") {
        user.isBanned = false;
      } else if (action === "promote") {
        user.role = "admin";
      } else if (action === "demote") {
        user.role = "user";
      } else {
        return res.status(400).json({ error: "Unknown action" });
      }

      await user.save();
      await createAudit(`user:${action}`, req.user && req.user._id, { target: id, action });
      return res.json({ success: true, data: user });
    } catch (e) {
      console.error("userAction error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to perform user action" });
    }
  },

  // POST /admin/user/:id/adjust-balance { coin, delta, reason }
  async adjustBalance(req, res) {
    try {
      const { id } = req.params;
      const { coin, delta, reason } = req.body;
      if (!id || !coin || typeof delta === "undefined") return res.status(400).json({ error: "Missing params" });

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const uppercaseCoin = String(coin).toUpperCase();
      let found = (user.wallets || []).find(w => w.coin === uppercaseCoin);
      if (!found) {
        user.wallets = user.wallets || [];
        user.wallets.push({ coin: uppercaseCoin, balance: Number(delta) });
      } else {
        found.balance = Number(found.balance || 0) + Number(delta);
        if (found.balance < 0) found.balance = 0;
      }
      await user.save();

      await Wallet.create({
        user: user._id,
        coin: uppercaseCoin,
        amount: Number(delta),
        address: '',
        tx: '',
        status: 'approved',
        processedBy: req.user && req.user._id,
        processedAt: new Date()
      }).catch(() => {});

      await createAudit("user:adjust_balance", req.user && req.user._id, { target: id, coin: uppercaseCoin, delta, reason });

      return res.json({ success: true, data: user });
    } catch (e) {
      console.error("adjustBalance error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to adjust balance" });
    }
  },

  // GET /admin/wallets?status=
  async listWallets(req, res) {
    try {
      const status = req.query.status || "pending";
      const query = {};
      if (status !== "all") query.status = status;
      const rows = await Wallet.find(query).sort({ createdAt: -1 }).limit(500).populate('user', 'email username').lean();
      return res.json({ success: true, data: rows });
    } catch (e) {
      console.error("listWallets error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to list wallets" });
    }
  },

  // POST /admin/wallets/:id/approve
  async approveWallet(req, res) {
    try {
      const { id } = req.params;
      const w = await Wallet.findById(id);
      if (!w) return res.status(404).json({ error: "Wallet entry not found" });

      if (w.status === 'approved') return res.status(400).json({ error: "Already approved" });

      w.status = "approved";
      w.processedBy = req.user && req.user._id;
      w.processedAt = new Date();
      await w.save();

      // credit user's embedded wallet
      const user = await User.findById(w.user);
      if (user) {
        const uppercaseCoin = String(w.coin).toUpperCase();
        let found = (user.wallets || []).find(x => x.coin === uppercaseCoin);
        if (!found) {
          user.wallets = user.wallets || [];
          user.wallets.push({ coin: uppercaseCoin, balance: Number(w.amount), address: '' });
        } else {
          found.balance = Number(found.balance || 0) + Number(w.amount);
        }
        await user.save();
      }

      await createAudit("wallet:approve", req.user && req.user._id, { walletId: id });
      broadcast({ type: "wallet_update", payload: w });

      return res.json({ success: true, data: w });
    } catch (e) {
      console.error("approveWallet error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to approve wallet" });
    }
  },

  // POST /admin/wallets/:id/reject { reason }
  async rejectWallet(req, res) {
    try {
      const { id } = req.params;
      const reason = req.body.reason || "rejected by admin";
      const w = await Wallet.findById(id);
      if (!w) return res.status(404).json({ error: "Wallet entry not found" });

      w.status = "rejected";
      w.reason = reason;
      w.processedBy = req.user && req.user._id;
      w.processedAt = new Date();
      await w.save();

      await createAudit("wallet:reject", req.user && req.user._id, { walletId: id, reason });
      broadcast({ type: "wallet_rejected", payload: { id, reason } });

      return res.json({ success: true, data: w });
    } catch (e) {
      console.error("rejectWallet error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to reject wallet" });
    }
  },

  // GET /admin/trades?search=
  async listTrades(req, res) {
    try {
      const q = (req.query.search || "").trim();
      const filter = {};
      if (q) {
        const regex = new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
        filter.$or = [{ pair: regex }, { 'user.email': regex }, { _id: regex }];
      }
      const rows = await Trade.find(filter).sort({ createdAt: -1 }).limit(500).populate('user', 'email username').lean();
      return res.json({ success: true, data: rows });
    } catch (e) {
      console.error("listTrades error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to list trades" });
    }
  },

  // POST /admin/trades/:id/cancel
  async cancelTrade(req, res) {
    try {
      const { id } = req.params;
      const trade = await Trade.findById(id);
      if (!trade) return res.status(404).json({ error: "Trade not found" });

      if (trade.status === "closed") return res.status(400).json({ error: "Trade already closed" });

      trade.status = "closed";
      trade.closedAt = new Date();
      trade.closedBy = req.user && req.user._id;
      await trade.save();

      await createAudit("trade:cancel", req.user && req.user._id, { tradeId: id });
      broadcast({ type: "trade_cancelled", payload: { id } });

      return res.json({ success: true, data: trade });
    } catch (e) {
      console.error("cancelTrade error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to cancel trade" });
    }
  },

  // POST /admin/broadcast { type, payload }
  async broadcast(req, res) {
    try {
      const body = req.body || {};
      if (!body.type || !body.payload) return res.status(400).json({ error: "Missing type/payload" });

      if (body.type === "price_update") {
        const { symbol, price } = body.payload;
        if (!symbol || typeof price === "undefined") return res.status(400).json({ error: "price_update requires symbol and price" });
        await Coin.findOneAndUpdate({ symbol: String(symbol).toUpperCase() }, { $set: { price: Number(price), lastPriceUpdate: new Date() } }, { upsert: true });
      }

      await createAudit("admin:broadcast", req.user && req.user._id, { broadcast: body });
      broadcast({ type: body.type, payload: body.payload, meta: { from: req.user ? req.user._id : null } });

      return res.json({ success: true, data: { sent: true } });
    } catch (e) {
      console.error("broadcast error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Broadcast failed" });
    }
  },

  // POST /admin/price_override { symbol, price, broadcast }
  async priceOverride(req, res) {
    try {
      const { symbol, price, broadcast: doBroadcast } = req.body || {};
      if (!symbol || typeof price === "undefined") return res.status(400).json({ error: "Missing symbol or price" });

      const updated = await Coin.findOneAndUpdate(
        { symbol: String(symbol).toUpperCase() },
        { $set: { price: Number(price), priceMode: 'manual', targetPrice: Number(price), lastPriceUpdate: new Date() } },
        { upsert: true, new: true }
      );

      await createAudit("admin:price_override", req.user && req.user._id, { symbol, price });

      if (doBroadcast) {
        broadcast({ type: "price_update", payload: { symbol: String(symbol).toUpperCase(), price: Number(price) } });
      }

      return res.json({ success: true, data: updated });
    } catch (e) {
      console.error("priceOverride error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Price override failed" });
    }
  },

  // GET /admin/logs
  async getLogs(req, res) {
    try {
      const tail = req.query.tail === 'true';
      if (AuditLog) {
        const rows = await AuditLog.find({}).sort({ createdAt: -1 }).limit(tail ? 1000 : 200).lean();
        const text = rows.map(r => `[${r.createdAt.toISOString()}] ${r.action} ${JSON.stringify(r.details || {})}`).join("\n");
        return res.send(text);
      }

      const logPath = path.resolve(process.cwd(), 'logs', 'server.log');
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        return res.send(content);
      }

      return res.send("No logs available (AuditLog model or logs/server.log not found).");
    } catch (e) {
      console.error("getLogs error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to get logs" });
    }
  },

  // GET /admin/settings
  async getSettings(req, res) {
    try {
      const settings = await Setting.findOne({}) || {};
      return res.json({ success: true, data: settings });
    } catch (e) {
      console.error("getSettings error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to get settings" });
    }
  },

  // POST /admin/settings
  async postSettings(req, res) {
    try {
      const payload = req.body || {};
      const settings = await Setting.findOneAndUpdate({}, { $set: payload }, { upsert: true, new: true });
      await createAudit("admin:settings_update", req.user && req.user._id, { payload });
      return res.json({ success: true, data: settings });
    } catch (e) {
      console.error("postSettings error:", e && (e.stack || e.message || e));
      return res.status(500).json({ error: "Failed to save settings" });
    }
  }
};