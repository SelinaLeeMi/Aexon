/**
 * priceUpdater.js
 * - Fetch Binance ticker prices in bulk
 * - Update Coin documents in DB every interval (5s)
 * - Supports admin override drift toward targetPrice
 * - Broadcasts changes via global.io and global.wss
 *
 * Usage: require('./jobs/priceUpdater')();  (call from server.js)
 */

const axios = require("axios");
const Coin = require("../models/Coin");

const INTERVAL_MS = parseInt(process.env.PRICE_ENGINE_INTERVAL_MS || "5000", 10);
const MAX_CHART_POINTS = parseInt(process.env.MAX_CHART_POINTS || "500", 10);

// Fetch Binance/USDT prices map
async function fetchBinanceMap() {
  try {
    const { data } = await axios.get("https://api.binance.com/api/v3/ticker/price", { timeout: 7000 });
    // data: [{ symbol: 'BTCUSDT', price: '...' }, ...]
    const map = {};
    data.forEach(d => map[d.symbol] = parseFloat(d.price));
    return map;
  } catch (err) {
    console.warn("fetchBinanceMap failed:", err.message || err);
    return {};
  }
}

// Fallback: CoinGecko simple price (fewer calls)
async function fetchCoinGeckoPrices(ids) {
  try {
    if (!ids || ids.length === 0) return {};
    const params = { vs_currencies: "usd", ids: ids.join(",") };
    const { data } = await axios.get("https://api.coingecko.com/api/v3/simple/price", { params, timeout: 7000 });
    // data: { bitcoin: { usd: 123 }, ... }
    const map = {};
    Object.keys(data).forEach(k => { map[k] = data[k].usd; });
    return map;
  } catch (err) {
    console.warn("fetchCoinGeckoPrices failed:", err.message || err);
    return {};
  }
}

async function updatePricesOnce() {
  try {
    const coins = await Coin.find({}).exec();
    if (!coins || coins.length === 0) return;

    // Build symbol list for Binance (e.g. BTCUSDT)
    const symbolPairs = coins.map(c => ({ symbol: c.symbol, pair: (c.symbol + "USDT").toUpperCase() }));

    const binanceMap = await fetchBinanceMap();

    // Update each coin
    const updates = [];
    for (const coin of coins) {
      const prev = coin.price || 0;
      coin.previousPrice = prev;

      // Admin override (smooth drift)
      if (coin.adminControlEnabled && coin.targetPrice != null) {
        const diff = coin.targetPrice - coin.price;
        const step = diff * (coin.driftSpeed || 0.03);
        coin.price = Number((coin.price + step).toFixed(8));
      } else {
        // Try Binance
        const pair = (coin.symbol + "USDT").toUpperCase();
        if (binanceMap[pair]) {
          coin.price = Number(binanceMap[pair]);
        } else {
          // fallback: leave current price (or will be updated by seed)
        }
      }

      // Append chart point
      coin.chartHistory = coin.chartHistory || [];
      coin.chartHistory.push({ price: coin.price, ts: Date.now() });

      // Cap length
      if (coin.chartHistory.length > MAX_CHART_POINTS) {
        coin.chartHistory = coin.chartHistory.slice(-MAX_CHART_POINTS);
      }

      coin.lastPriceUpdate = new Date();
      updates.push(coin.save());
    }

    await Promise.all(updates);

    // Broadcast snapshot (lightweight)
    const snapshot = coins.map(c => ({ symbol: c.symbol, price: Number(c.price || 0) }));
    try {
      if (global.io && typeof global.io.emit === "function") global.io.emit("coin_prices", snapshot);
    } catch (_) {}
    try {
      if (global.wss && global.wss.clients) {
        global.wss.clients.forEach(c => {
          try { if (c.readyState === 1) c.send(JSON.stringify({ type: "coin_prices", payload: snapshot })); } catch (_) {}
        });
      }
    } catch (_) {}

  } catch (err) {
    console.error("updatePricesOnce error:", err && (err.stack || err.message || err));
  }
}

function startPriceEngine() {
  console.log(`Price engine starting (interval ${INTERVAL_MS}ms)`);
  // run immediately, then interval
  updatePricesOnce().catch(e => console.warn("initial price update failed:", e && e.message));
  const id = setInterval(() => {
    updatePricesOnce().catch(e => console.warn("price update failed:", e && e.message));
  }, INTERVAL_MS);
  // provide stop handle if needed
  return () => clearInterval(id);
}

module.exports = startPriceEngine;
