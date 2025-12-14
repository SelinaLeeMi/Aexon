/**
 * coinController.js
 * - GET /api/coin  -> list coins from DB
 * - GET /api/coin/:symbol -> single coin
 *
 * Safe, defensive controller:
 *  - Validates and clamps pagination inputs
 *  - Returns minimal, stable shape for frontend
 *  - Avoids leaking internal DB fields
 */

const Coin = require("../models/Coin");

// Helper: sanitize symbol for icon url fallback
function safeSymbolForIcon(sym) {
  try {
    return String(sym || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  } catch (_) {
    return "";
  }
}

// GET /api/coin
exports.getCoins = async (req, res) => {
  try {
    // limit/skip parsing and clamping
    const rawLimit = parseInt(req.query.limit, 10);
    const rawSkip = parseInt(req.query.skip, 10);
    const DEFAULT_LIMIT = 100;
    const MAX_LIMIT = 200;

    const limit = Number.isFinite(rawLimit) ? Math.min(MAX_LIMIT, Math.max(1, rawLimit)) : DEFAULT_LIMIT;
    const skip = Number.isFinite(rawSkip) ? Math.max(0, rawSkip) : 0;

    // Basic projection: we only need public fields
    const projection = {
      symbol: 1,
      name: 1,
      price: 1,
      previousPrice: 1,
      icon: 1,
      isCustom: 1,
      chartHistory: 1
    };

    const coins = await Coin.find({})
      .sort({ marketCapRank: 1 })
      .skip(skip)
      .limit(limit)
      .select(projection)
      .lean()
      .exec();

    const out = (coins || []).map(c => ({
      symbol: c.symbol,
      name: c.name,
      price: Number(c.price || 0),
      previousPrice: Number(c.previousPrice || 0),
      iconUrl: c.icon || `/icons/main/${safeSymbolForIcon(c.symbol)}.png`,
      isCustom: !!c.isCustom,
      chartHistory: Array.isArray(c.chartHistory) ? c.chartHistory.slice(-100) : [] // limit client payload size
    }));

    res.json({ success: true, msg: "Fetched coins", data: out });
  } catch (err) {
    // Avoid leaking stack to client
    console.error("coinController.getCoins error:", err && (err.stack || err.message || err));
    res.status(500).json({ success: false, error: "Failed to load coins", data: [] });
  }
};

// GET /api/coin/:symbol
exports.getCoin = async (req, res) => {
  try {
    const raw = String(req.params.symbol || "").trim();
    if (!raw) return res.status(400).json({ success: false, error: "Missing symbol" });

    const symbol = raw.toUpperCase();

    // Basic format validation: alphanumeric up to 10 chars
    if (!/^[A-Z0-9]{1,10}$/.test(symbol)) {
      return res.status(400).json({ success: false, error: "Invalid symbol format" });
    }

    const projection = {
      symbol: 1,
      name: 1,
      price: 1,
      previousPrice: 1,
      icon: 1,
      isCustom: 1,
      chartHistory: 1
    };

    const coin = await Coin.findOne({ symbol }).select(projection).lean().exec();
    if (!coin) return res.status(404).json({ success: false, error: "Coin not found" });

    res.json({
      success: true,
      data: {
        symbol: coin.symbol,
        name: coin.name,
        price: Number(coin.price || 0),
        previousPrice: Number(coin.previousPrice || 0),
        iconUrl: coin.icon || `/icons/main/${safeSymbolForIcon(coin.symbol)}.png`,
        isCustom: !!coin.isCustom,
        chartHistory: Array.isArray(coin.chartHistory) ? coin.chartHistory : []
      }
    });
  } catch (err) {
    console.error("coinController.getCoin error:", err && (err.stack || err.message || err));
    res.status(500).json({ success: false, error: "Failed to load coin" });
  }
};