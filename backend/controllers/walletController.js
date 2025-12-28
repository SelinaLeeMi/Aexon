/**
 * Wallet Controller - Professional Refactor
 * Features: Filtering, pagination, standardized responses
 *
 * Enhancements:
 * - GET /wallet/summary: authoritative ledger-derived summary with prices and precomputed fiat values.
 * - Uses walletSummaryCache to speed up repeated reads and minimize recomputation.
 */

const User = require("../models/User");
const DepositRequest = require("../models/DepositRequest");
const WithdrawRequest = require("../models/WithdrawRequest");
const Trade = require("../models/Trade");
const Coin = require("../models/Coin");

const { getBalance, getAllBalances, postLedgerEntry } = require('../utils/ledger');
const walletSummaryCache = require('../utils/walletSummaryCache');

// User can only view their wallets
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    // Robust: always return the wallets array only, not the full user object
    return res.json({ success: true, data: user.wallets || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// New: GET /wallet/summary
// Returns ledger-derived balances, coin prices, fiat per-asset, and totalFiat.
// Uses a small in-memory cache to speed up repeated loads (short TTL).
exports.getWalletSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    // Try cached value first
    const cached = walletSummaryCache.get(userId);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    // Get authoritative balances from ledger
    const balances = await getAllBalances(userId); // [{ coin, balance }, ...]

    // Build symbol list
    const symbols = balances.map(b => String(b.coin).toUpperCase());

    // Fetch coins/prices in bulk
    let coins = [];
    if (symbols.length > 0) {
      coins = await Coin.find({ symbol: { $in: symbols } }).lean();
    }

    // Map symbol -> price
    const priceMap = {};
    coins.forEach(c => {
      priceMap[String(c.symbol).toUpperCase()] = typeof c.price === 'number' ? c.price : 0;
    });

    // Compose result rows
    const rows = balances.map(b => {
      const coin = String(b.coin).toUpperCase();
      const balance = Number(b.balance || 0);
      const price = Number(priceMap[coin] || 0);
      const fiatValue = Number((balance * price) || 0);
      return { coin, balance, price, fiatValue };
    });

    // total fiat
    const totalFiat = rows.reduce((acc, r) => acc + Number(r.fiatValue || 0), 0);

    const result = {
      balances: rows,
      totalFiat: Number(totalFiat),
      fetchedAt: new Date().toISOString()
    };

    // Cache the result (short TTL)
    try {
      walletSummaryCache.set(userId, result);
    } catch (err) {
      // non-fatal if caching fails
      console.warn("walletSummaryCache.set failed:", err && err.message);
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("getWalletSummary error:", error && (error.stack || error.message || error));
    res.status(500).json({ success: false, error: "Failed to get wallet summary" });
  }
};

// User: transaction history (with filters, pagination)
exports.listTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { coin = "", type = "", date = "", page = 0, limit = 20 } = req.query;

    // Fetch all types for the user
    const [deposits, withdrawals, trades] = await Promise.all([
      DepositRequest.find({ user: userId }),
      WithdrawRequest.find({ user: userId }),
      Trade.find({ user: userId }),
    ]);

    // Merge and map
    let txs = [
      ...deposits.map((d) => ({
        _id: d._id,
        coin: d.coin,
        type: "deposit",
        amount: d.amount,
        timestamp: d.createdAt,
        description: d.note || "",
        status: d.status,
      })),
      ...withdrawals.map((w) => ({
        _id: w._id,
        coin: w.coin,
        type: "withdraw",
        amount: w.amount,
        timestamp: w.createdAt,
        description: w.note || "",
        status: w.status,
      })),
      ...trades.map((t) => ({
        _id: t._id,
        coin: t.coin,
        type: "trade",
        amount: t.amount,
        timestamp: t.createdAt,
        description: t.side ? `${t.side} ${t.pair}` : "",
        status: t.status || "filled",
      })),
    ];

    // Filtering
    if (coin) txs = txs.filter((tx) => tx.coin === coin);
    if (type) txs = txs.filter((tx) => tx.type === type);
    if (date) txs = txs.filter((tx) => tx.timestamp && tx.timestamp.toISOString().slice(0, 10) === date);

    // Sort descending
    txs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const total = txs.length;
    const paged = txs.slice(page * limit, (page + 1) * limit);

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      rows: paged,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin can set/change balances and deposit addresses
// Note: This function uses ledger.postLedgerEntry (authoritative). After ledger write, we invalidate wallet summary cache.
exports.adminSetBalance = async (req, res) => {
  try {
    const { userId, coin, balance } = req.body;
    if (!userId || !coin || typeof balance !== "number" || balance < 0)
      return res.status(400).json({ success: false, error: "Invalid balance data." });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    let wallet = user.wallets.find((w) => w.coin === coin.toUpperCase());
    const uppercaseCoin = coin.toUpperCase();

    // Determine ledger delta (ledger is authoritative)
    let prevLedgerBalance;
    try {
      prevLedgerBalance = await getBalance(userId, uppercaseCoin);
    } catch (err) {
      console.error("getBalance error in adminSetBalance:", err && err.message);
      prevLedgerBalance = 0;
    }
    const desiredBalance = Number(balance);
    const delta = desiredBalance - Number(prevLedgerBalance);

    if (delta === 0) {
      // Nothing to change at ledger level, but ensure embedded wallet is synced
      if (!wallet) {
        user.wallets.push({ coin: uppercaseCoin, balance: desiredBalance, address: "" });
      } else {
        wallet.balance = desiredBalance;
      }
      await user.save();
      return res.json({ success: true, msg: "Balance updated" });
    }

    // post ledger entry (this enforces non-negative new balance)
    let ledgerResult;
    try {
      ledgerResult = await postLedgerEntry(userId, 'adjustment', uppercaseCoin, delta, {
        subtype: 'admin_set_balance',
        ref: `admin_set_balance:${userId}`,
        note: `Admin set balance to ${desiredBalance}`,
        meta: { performedBy: req.user && req.user._id }
      });
    } catch (err) {
      console.error("postLedgerEntry failed in adminSetBalance:", err && (err.message || err));
      if (err && /Insufficient balance/i.test(err.message)) {
        return res.status(400).json({ success: false, error: "Insufficient balance" });
      }
      return res.status(500).json({ success: false, error: "Failed to update ledger balance" });
    }

    // Sync embedded wallet to ledger authoritative balance
    if (!wallet) {
      user.wallets.push({ coin: uppercaseCoin, balance: Number(ledgerResult.balance), address: "" });
    } else {
      wallet.balance = Number(ledgerResult.balance);
    }
    await user.save();

    // Invalidate wallet summary cache for this user
    try {
      walletSummaryCache.invalidate(userId);
    } catch (err) {
      console.warn("walletSummaryCache.invalidate failed:", err && err.message);
    }

    return res.json({ success: true, msg: "Balance updated" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.adminSetDepositAddress = async (req, res) => {
  try {
    const { userId, coin, address } = req.body;
    if (!userId || !coin || !address)
      return res.status(400).json({ success: false, error: "Invalid deposit address data." });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    let wallet = user.wallets.find((w) => w.coin === coin.toUpperCase());
    if (!wallet) {
      user.wallets.push({ coin: coin.toUpperCase(), balance: 0, address });
    } else {
      wallet.address = address;
    }
    await user.save();
    res.json({ success: true, msg: "Deposit address updated" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};