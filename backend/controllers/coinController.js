/**
 * coinController.js
 * - GET /api/coin  -> list coins from DB
 * - GET /api/coin/:symbol -> single coin
 *
 * It expects coins to be seeded (seed script below).
 */

const Coin = require("../models/Coin");

// GET /api/coin
exports.getCoins = async (req, res) => {
  try {
    // simple pagination (optional query: ?limit=50&skip=0)
    const limit = Math.min(200, parseInt(req.query.limit || "100", 10));
    const skip = Math.max(0, parseInt(req.query.skip || "0", 10));

    const coins = await Coin.find({})
      .sort({ marketCapRank: 1 }) // if present
      .skip(skip)
      .limit(limit)
      .lean();

    // Return minimal safe shape for frontend
    const out = coins.map(c => ({
      symbol: c.symbol,
      name: c.name,
      price: Number(c.price || 0),
      previousPrice: Number(c.previousPrice || 0),
      iconUrl: c.icon || `/icons/main/${c.symbol.toLowerCase()}.png`,
      isCustom: !!c.isCustom,
      chartHistory: c.chartHistory || []
    }));

    res.json({ success: true, msg: "Fetched coins", data: out });
  } catch (err) {
    console.error("coinController.getCoins error:", err && (err.stack || err.message || err));
    res.status(500).json({ success: false, error: "Failed to load coins", data: [] });
  }
};

// GET /api/coin/:symbol
exports.getCoin = async (req, res) => {
  try {
    const symbol = (req.params.symbol || "").toUpperCase();
    if (!symbol) return res.status(400).json({ success: false, error: "Missing symbol" });
    const coin = await Coin.findOne({ symbol }).lean();
    if (!coin) return res.status(404).json({ success: false, error: "Coin not found" });

    res.json({
      success: true,
      data: {
        symbol: coin.symbol,
        name: coin.name,
        price: Number(coin.price || 0),
        previousPrice: Number(coin.previousPrice || 0),
        iconUrl: coin.icon || `/icons/main/${coin.symbol.toLowerCase()}.png`,
        isCustom: !!coin.isCustom,
        chartHistory: coin.chartHistory || []
      }
    });
  } catch (err) {
    console.error("coinController.getCoin error:", err && (err.stack || err.message || err));
    res.status(500).json({ success: false, error: "Failed to load coin" });
  }
};
