/**
 * priceUpdater.js
 * - Fetch Binance ticker prices in bulk
 * - Update Coin documents in DB every interval (5000ms default)
 * - Supports admin override drift toward targetPrice
 * - Broadcasts changes via global.io and global.wss
 *
 * Key improvements:
 *  - Uses bulkWrite for efficient, atomic updates
 *  - Caps chartHistory server-side using $push with $slice
 *  - Protects against overlapping runs with inProgress guard
 *  - Defensive parsing & numeric handling
 */

const axios = require("axios");
const Coin = require("../models/Coin");

const INTERVAL_MS = parseInt(process.env.PRICE_ENGINE_INTERVAL_MS || "5000", 10);
const MAX_CHART_POINTS = Math.max(50, parseInt(process.env.MAX_CHART_POINTS || "500", 10));

let inProgress = false;

// Fetch Binance/USDT prices map
async function fetchBinanceMap() {
  try {
    const { data } = await axios.get("https://api.binance.com/api/v3/ticker/price", { timeout: 7000 });
    // data: [{ symbol: 'BTCUSDT', price: '...' }, ...]
    const map = Object.create(null);
    (data || []).forEach(d => {
      if (d && d.symbol && d.price) {
        map[String(d.symbol).toUpperCase()] = parseFloat(d.price);
      }
    });
    return map;
  } catch (err) {
    console.warn("fetchBinanceMap failed:", err && (err.message || err));
    return {};
  }
}

async function updatePricesOnce() {
  if (inProgress) {
    // Avoid overlapping runs
    console.warn("updatePricesOnce skipped: previous run still in progress");
    return;
  }
  inProgress = true;

  try {
    const coins = await Coin.find({}).lean().exec();
    if (!Array.isArray(coins) || coins.length === 0) return;

    const binanceMap = await fetchBinanceMap();

    const bulkOps = [];
    const snapshot = []; // snapshot to broadcast

    for (const c of coins) {
      // defensive numeric conversions
      const current = Number(c.price || 0);
      const prev = Number(c.previousPrice || current);
      let newPrice = current;

      // Admin manual drift logic
      if (c.adminControlEnabled && c.targetPrice != null) {
        const target = Number(c.targetPrice);
        const driftSpeed = Math.max(0, Number(c.driftSpeed || 0.03));
        const diff = target - current;
        const step = diff * driftSpeed;
        // prevent NaN
        if (Number.isFinite(step)) {
          newPrice = Number((current + step).toFixed(8));
          if (!Number.isFinite(newPrice)) newPrice = current;
        } else {
          newPrice = current;
        }
      } else {
        // Use Binance map if available
        const pair = (String(c.symbol || "") + "USDT").toUpperCase();
        if (Object.prototype.hasOwnProperty.call(binanceMap, pair) && Number.isFinite(binanceMap[pair])) {
          newPrice = Number(binanceMap[pair]);
        } else {
          // keep current price (no external price available)
          newPrice = current;
        }
      }

      // Ensure non-negative and finite
      if (!Number.isFinite(newPrice) || newPrice < 0) newPrice = Math.max(0, current);

      const chartPoint = { price: Number(newPrice), ts: Date.now() };
      const lastPriceUpdate = new Date();

      // Build update operation using $set and $push with $slice
      const update = {
        $set: {
          previousPrice: Number(prev),
          price: Number(newPrice),
          lastPriceUpdate
        },
        $push: {
          // push with $each + $slice to cap the length
          chartHistory: {
            $each: [chartPoint],
            $slice: -Math.abs(MAX_CHART_POINTS)
          }
        }
      };

      bulkOps.push({
        updateOne: {
          filter: { _id: c._id },
          update
        }
      });

      snapshot.push({ symbol: c.symbol, price: Number(newPrice || 0) });
    }

    if (bulkOps.length > 0) {
      // run unordered to continue on individual doc errors
      await Coin.bulkWrite(bulkOps, { ordered: false });
    }

    // Broadcast lightweight snapshot
    try {
      if (global.io && typeof global.io.emit === "function") global.io.emit("coin_prices", snapshot);
    } catch (_) {}
    try {
      if (global.wss && global.wss.clients) {
        global.wss.clients.forEach(client => {
          try {
            if (client && client.readyState === 1) {
              client.send(JSON.stringify({ type: "coin_prices", payload: snapshot }));
            }
          } catch (_) {}
        });
      }
    } catch (_) {}
  } catch (err) {
    console.error("updatePricesOnce error:", err && (err.stack || err.message || err));
  } finally {
    inProgress = false;
  }
}

function startPriceEngine() {
  console.log(`Price engine starting (interval ${INTERVAL_MS}ms, chart limit ${MAX_CHART_POINTS})`);
  // run immediately, then interval
  updatePricesOnce().catch(e => console.warn("initial price update failed:", e && e.message));
  const id = setInterval(() => {
    updatePricesOnce().catch(e => console.warn("price update failed:", e && e.message));
  }, INTERVAL_MS);
  return () => clearInterval(id);
}

module.exports = startPriceEngine;