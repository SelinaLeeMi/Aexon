/**
 * Coin Price Simulator
 *
 * - Designed for CustomCoin model (admin-created coins where manual control / candlesticks exist)
 * - Defensive: works only on custom coins and leaves production Coin model untouched
 *
 * Exports:
 *  - startSimulator() -> returns stop handle
 *  - runCoinSimulator() -> runs once (useful for tests)
 */

const axios = require("axios");
const CustomCoin = require("../models/CustomCoin");

async function getBTCPrice() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      { params: { ids: "bitcoin", vs_currencies: "usd" }, timeout: 7000 }
    );
    return res && res.data && res.data.bitcoin ? Number(res.data.bitcoin.usd) : null;
  } catch (err) {
    // do not throw, simulator can run without BTC reference
    console.warn("getBTCPrice failed:", err && (err.message || err));
    return null;
  }
}

function interpolatePrice(current, target, stepFraction) {
  return current + (target - current) * stepFraction;
}

async function runCoinSimulator() {
  try {
    const btcPrice = await getBTCPrice();
    const coins = await CustomCoin.find({ isActive: true }).exec();
    if (!coins || coins.length === 0) return;

    const ops = [];

    for (const coin of coins) {
      const current = Number(coin.price || 0);
      let newPrice = current;

      // Manual mode with timer
      if (coin.priceMode === "manual" && coin.targetPrice != null && coin.priceTimerEnd && coin.priceTimerEnd.getTime() > Date.now()) {
        const timerTotal = Math.max(1, coin.priceTimerEnd.getTime() - (coin.updatedAt ? coin.updatedAt.getTime() : Date.now()));
        const timerElapsed = Math.max(0, Date.now() - (coin.updatedAt ? coin.updatedAt.getTime() : Date.now()));
        const stepFraction = Math.min(1, timerElapsed / timerTotal);
        // blend between current and target
        newPrice = interpolatePrice(current, Number(coin.targetPrice), 0.15 + stepFraction * 0.6);
        if (Math.abs(newPrice - coin.targetPrice) < 0.01) newPrice = Number(coin.targetPrice);
        coin.priceDirection = (coin.targetPrice > coin.price) ? "bull" : (coin.targetPrice < coin.price) ? "bear" : "neutral";
      } else {
        // Random drift influenced by BTC (if available)
        let pct;
        if (btcPrice && btcPrice > 0) {
          pct = ((btcPrice - current) / btcPrice) * (Math.random() * 0.05);
        } else {
          pct = (Math.random() - 0.5) * 0.06;
        }
        if (coin.priceDirection === "bull") pct = Math.abs(pct);
        if (coin.priceDirection === "bear") pct = -Math.abs(pct);
        newPrice = Math.max(0.01, current + current * pct);
      }

      newPrice = Number(Number(newPrice).toFixed(6));

      // If timer ended, switch to random
      let newPriceMode = coin.priceMode;
      let newTargetPrice = coin.targetPrice;
      if (coin.priceMode === "manual" && coin.priceTimerEnd && coin.priceTimerEnd.getTime() <= Date.now()) {
        newPriceMode = "random";
        newTargetPrice = null;
      }

      // Candlesticks update (1d)
      const now = new Date();
      let updatedCandlesticks = Array.isArray(coin.candlesticks) ? coin.candlesticks : [];
      let dailyCandles = updatedCandlesticks.find(cs => cs.interval === "1d");
      if (!dailyCandles) {
        dailyCandles = { interval: "1d", data: [] };
        updatedCandlesticks.push(dailyCandles);
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      if (dailyCandles.data.length === 0 || new Date(dailyCandles.data[dailyCandles.data.length - 1].time).toISOString().slice(0, 10) !== todayStr) {
        dailyCandles.data.push({
          time: now,
          open: newPrice,
          high: newPrice,
          low: newPrice,
          close: newPrice,
          volume: 0
        });
      } else {
        const candle = dailyCandles.data[dailyCandles.data.length - 1];
        candle.high = Math.max(candle.high || newPrice, newPrice);
        candle.low = Math.min(candle.low || newPrice, newPrice);
        candle.close = newPrice;
        candle.time = now;
      }

      const update = {
        $set: {
          price: newPrice,
          priceMode: newPriceMode,
          targetPrice: newTargetPrice,
          priceDirection: coin.priceDirection || "neutral",
          lastPriceUpdate: new Date()
        },
        $setOnInsert: {}
      };

      // set full candlesticks value (small number of custom coins expected)
      update.$set.candlesticks = updatedCandlesticks;

      ops.push({
        updateOne: {
          filter: { _id: coin._id },
          update,
          upsert: false
        }
      });
    }

    if (ops.length > 0) {
      await CustomCoin.bulkWrite(ops, { ordered: false });
    }
  } catch (err) {
    console.error("runCoinSimulator error:", err && (err.stack || err.message || err));
  }
}

function startSimulator(intervalMs = 5000) {
  const id = setInterval(() => {
    runCoinSimulator().catch(e => console.warn("coin simulator run failed:", e && (e.message || e)));
  }, intervalMs);
  return () => clearInterval(id);
}

module.exports = { startSimulator, runCoinSimulator };