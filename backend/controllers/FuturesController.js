/**
 * Futures Controller - Professional Refactor
 * Features: Input validation, live price fetch, standardized responses
 */
const FuturesPosition = require("../models/FuturesPosition");
const User = require("../models/User");
const axios = require("axios");

async function getCurrentPrice(pair) {
  const [base] = pair.split("/");
  const map = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    BNB: "binancecoin",
  };
  const coinId = map[base.toUpperCase()] || base.toLowerCase();
  try {
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: { ids: coinId, vs_currencies: "usd" },
    });
    return data[coinId]?.usd || null;
  } catch {
    return null;
  }
}

exports.openFuturesPosition = async (req, res) => {
  try {
    const { pair, direction, amount, price, leverage, tp, sl } = req.body;
    if (!pair || !direction || !amount || !price || !leverage)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    // Check USDT balance
    let usdtWallet = user.wallets.find((w) => w.coin.toUpperCase() === "USDT");
    if (!usdtWallet || usdtWallet.balance < amount) {
      return res.status(400).json({ success: false, error: "Not enough USDT balance" });
    }
    usdtWallet.balance -= amount;
    await user.save();

    const position = await FuturesPosition.create({
      user: req.user.id,
      pair,
      direction,
      amount,
      entryPrice: price,
      leverage,
      tp,
      sl,
    });
    res.status(201).json({ success: true, msg: "Position opened", data: position });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.closeFuturesPosition = async (req, res) => {
  try {
    const { positionId } = req.body;
    const position = await FuturesPosition.findById(positionId);
    if (!position || position.status !== "open") {
      return res.status(404).json({ success: false, error: "Position not found or already closed" });
    }
    const currentPrice = await getCurrentPrice(position.pair);
    if (!currentPrice) return res.status(400).json({ success: false, error: "Failed to fetch price" });

    // Simple PnL calculation
    let pnl = 0;
    const entry = position.entryPrice;
    const amt = position.amount;
    const lev = position.leverage;
    if (position.direction === "long") {
      pnl = ((currentPrice - entry) / entry) * amt * lev;
    } else {
      pnl = ((entry - currentPrice) / entry) * amt * lev;
    }

    // Refund margin + PnL to user's USDT wallet
    const user = await User.findById(position.user);
    let usdtWallet = user.wallets.find((w) => w.coin.toUpperCase() === "USDT");
    if (!usdtWallet) {
      user.wallets.push({ coin: "USDT", balance: 0, address: "" });
      usdtWallet = user.wallets.find((w) => w.coin.toUpperCase() === "USDT");
    }
    usdtWallet.balance += amt + pnl;
    await user.save();

    position.status = "closed";
    position.closedPrice = currentPrice;
    position.pnl = pnl;
    await position.save();

    res.json({ success: true, msg: "Position closed", data: position });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.listMyFuturesPositions = async (req, res) => {
  try {
    const positions = await FuturesPosition.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: positions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};