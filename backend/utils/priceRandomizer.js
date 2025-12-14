/**
 * Coin Price Randomizer Utility
 * - Randomly adjusts prices for all coins (±5%) for market simulation.
 * - Safe: ensures prices remain >= 0.01 and logs failures.
 * - Exported as a start function (returns stop handle) and as single-run function.
 */
const Coin = require('../models/Coin');

async function randomizePricesOnce() {
  try {
    const coins = await Coin.find().exec();
    const ops = [];
    for (const coin of coins) {
      const current = Number(coin.price || 0);
      const change = (Math.random() - 0.5) * 0.1; // ±5%
      let newPrice = current * (1 + change);
      newPrice = Math.max(0.01, Number(newPrice.toFixed(6)));

      ops.push({
        updateOne: {
          filter: { _id: coin._id },
          update: {
            $set: {
              previousPrice: current,
              price: newPrice,
              lastPriceUpdate: new Date()
            },
            $push: {
              chartHistory: {
                $each: [{ price: newPrice, ts: Date.now() }],
                $slice: -500 // keep a reasonable cap; real cap controlled by env/MAX_CHART_POINTS in priceUpdater
              }
            }
          }
        }
      });
    }

    if (ops.length > 0) {
      await Coin.bulkWrite(ops, { ordered: false });
    }
    console.log("✅ Coin prices randomized.");
  } catch (err) {
    console.error("❌ Price randomizer failed:", err && (err.stack || err.message || err));
  }
}

function startPriceRandomizer(intervalMs = 5 * 60 * 1000) {
  if (process.env.DISABLE_PRICE_RANDOMIZER === 'true') {
    console.log("⏸ Coin price randomizer is disabled by environment variable.");
    return () => {};
  }
  const id = setInterval(() => {
    randomizePricesOnce().catch(e => console.warn("price randomizer run failed:", e && (e.message || e)));
  }, intervalMs);
  return () => clearInterval(id);
}

module.exports = { startPriceRandomizer, randomizePricesOnce };