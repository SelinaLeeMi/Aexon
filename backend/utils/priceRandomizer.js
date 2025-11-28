/**
 * Coin Price Randomizer Utility - Premium Professional Refactor
 * Randomly adjusts prices for all coins (±5%) for market simulation.
 */
const Coin = require('../models/Coin');

/**
 * Randomly adjust prices for all coins (±5%).
 * Useful for simulating market fluctuations.
 */
async function randomizePrices() {
  try {
    const coins = await Coin.find();
    for (const coin of coins) {
      const change = (Math.random() - 0.5) * 0.1; // ±5%
      coin.price = Math.max(0.01, coin.price * (1 + change));
      await coin.save();
    }
    console.log("✅ Coin prices randomized.");
  } catch (err) {
    console.error("❌ Price randomizer failed:", err);
  }
}

/**
 * Start price randomizer periodically (every 5 minutes).
 */
function startPriceRandomizer() {
  if (process.env.DISABLE_PRICE_RANDOMIZER === 'true') {
    console.log("⏸ Coin price randomizer is disabled by environment variable.");
    return;
  }
  setInterval(randomizePrices, 5 * 60 * 1000);
}

module.exports = startPriceRandomizer;