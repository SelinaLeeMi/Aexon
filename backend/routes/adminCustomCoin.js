const express = require("express");
const router = express.Router();
const Coin = require("../models/Coin");

// Add custom coin
router.post("/add", async (req, res) => {
  try {
    const { symbol, name, icon, price } = req.body;

    const exists = await Coin.findOne({ symbol: symbol.toUpperCase() });
    if (exists) return res.json({ success: false, error: "Coin already exists" });

    const coin = await Coin.create({
      symbol: symbol.toUpperCase(),
      name,
      icon,
      price,
      previousPrice: price,
      isCustom: true,
      adminControlEnabled: true,
      targetPrice: price,
    });

    res.json({ success: true, coin });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Update target price
router.post("/set-target", async (req, res) => {
  try {
    const { symbol, targetPrice, driftSpeed } = req.body;

    const coin = await Coin.findOne({ symbol: symbol.toUpperCase() });
    if (!coin) return res.json({ success: false, error: "Coin not found" });

    coin.adminControlEnabled = true;
    coin.targetPrice = targetPrice;
    if (driftSpeed) coin.driftSpeed = driftSpeed;

    await coin.save();

    res.json({ success: true, coin });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Disable override
router.post("/disable-control", async (req, res) => {
  try {
    const symbol = req.body.symbol.toUpperCase();
    const coin = await Coin.findOne({ symbol });

    if (!coin) return res.json({ success: false, error: "Not found" });

    coin.adminControlEnabled = false;
    coin.targetPrice = null;

    await coin.save();

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
