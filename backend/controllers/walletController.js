/**
 * Wallet Controller - Professional Refactor
 * Features: Filtering, pagination, standardized responses
 */
const User = require("../models/User");
const DepositRequest = require("../models/DepositRequest");
const WithdrawRequest = require("../models/WithdrawRequest");
const Trade = require("../models/Trade");

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
exports.adminSetBalance = async (req, res) => {
  try {
    const { userId, coin, balance } = req.body;
    if (!userId || !coin || typeof balance !== "number" || balance < 0)
      return res.status(400).json({ success: false, error: "Invalid balance data." });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    let wallet = user.wallets.find((w) => w.coin === coin.toUpperCase());
    if (!wallet) {
      user.wallets.push({ coin: coin.toUpperCase(), balance, address: "" });
    } else {
      wallet.balance = balance;
    }
    await user.save();
    res.json({ success: true, msg: "Balance updated" });
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