/**
 * Trade Controller - Fixed to match route names
 */
const Trade = require("../models/Trade");
const { postLedgerEntry, getBalance } = require("../utils/ledger");
const { createAudit } = require("../utils/auditLog");

// POST /api/trade/place
exports.placeTrade = async (req, res) => {
  try {
    const { pair, size, side, price, type } = req.body;

    const [base, quote] = pair.split("/");
    if (!base || !quote) {
      return res.status(400).json({ success: false, error: "Invalid pair format." });
    }

    const spendCoin = side === "buy" ? quote : base;
    const cost = side === "buy" ? size * (price || 1) : size;

    const available = await getBalance(req.user.id, spendCoin);
    if (available < cost) {
      return res.status(400).json({ success: false, error: "Insufficient balance." });
    }

    await postLedgerEntry(req.user.id, "trade", spendCoin, -cost, {
      subtype: side,
      note: `${type || "market"} ${side} ${size} ${pair} @${price || "market"}`
    });

    const receiveCoin = side === "buy" ? base : quote;
    const received = side === "buy" ? size : size * (price || 1);

    await postLedgerEntry(req.user.id, "trade", receiveCoin, received, {
      subtype: side,
      note: `Fill side ${side}, pair ${pair}`
    });

    const trade = new Trade({
      user: req.user.id,
      pair,
      size,
      price: price || 0,
      side,
      type: type || "market",
      status: "filled",
      filledAt: new Date(),
    });

    await trade.save();
    await createAudit("trade:place", req.user.id, { tradeId: trade._id });

    res.status(201).json({ success: true, data: trade });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/trade/my
exports.getMyTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ user: req.user.id }).sort({ filledAt: -1 });
    res.json({ success: true, data: trades });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
