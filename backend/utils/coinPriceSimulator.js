/**
 * Coin Price Simulator - Professional Simulation for Coins
 * Random drift plus admin "manual" price trending (like Binance pump/dump)
 */
const Coin = require("../models/Coin");
const axios = require("axios");

async function getBTCPrice() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      { params: { ids: "bitcoin", vs_currencies: "usd" } }
    );
    return res.data.bitcoin.usd;
  } catch (err) {
    return null;
  }
}

function interpolatePrice(current, target, stepFraction) {
  return current + (target - current) * stepFraction;
}

async function runCoinSimulator() {
  const btcPrice = await getBTCPrice();
  const coins = await Coin.find();

  for (const coin of coins) {
    let newPrice = coin.price;
    if (coin.priceMode === "manual" && coin.targetPrice && coin.priceTimerEnd > Date.now()) {
      const timerTotal = coin.priceTimerEnd - coin.updatedAt;
      const timerElapsed = Date.now() - coin.updatedAt;
      const stepFraction = Math.min(1, timerElapsed / timerTotal);
      newPrice = interpolatePrice(coin.price, coin.targetPrice, 0.15 + stepFraction * 0.6);
      if (Math.abs(newPrice - coin.targetPrice) < 0.01) newPrice = coin.targetPrice;
      coin.priceDirection = (coin.targetPrice > coin.price)
        ? "bull"
        : (coin.targetPrice < coin.price)
          ? "bear"
          : "neutral";
    } else {
      let pct = btcPrice
        ? ((btcPrice - coin.price) / btcPrice) * (Math.random() * 0.05)
        : (Math.random() - 0.5) * 0.06;
      if (coin.priceDirection === "bull") pct = Math.abs(pct);
      if (coin.priceDirection === "bear") pct = -Math.abs(pct);
      newPrice = Math.max(0.01, coin.price + coin.price * pct);
    }
    coin.price = Number(newPrice.toFixed(6));
    if (coin.priceMode === "manual" && coin.priceTimerEnd && coin.priceTimerEnd < Date.now()) {
      coin.priceMode = "random";
      coin.targetPrice = undefined;
    }
    // Candlesticks update
    if (!coin.candlesticks) coin.candlesticks = [];
    let dailyCandles = coin.candlesticks.find(cs => cs.interval === "1d");
    if (!dailyCandles) {
      dailyCandles = { interval: "1d", data: [] };
      coin.candlesticks.push(dailyCandles);
    }
    let today = new Date().toISOString().slice(0, 10);
    if (
      dailyCandles.data.length === 0 ||
      new Date(dailyCandles.data[dailyCandles.data.length - 1].time).toISOString().slice(0, 10) !== today
    ) {
      dailyCandles.data.push({
        time: new Date(),
        open: coin.price, high: coin.price, low: coin.price, close: coin.price
      });
    } else {
      let candle = dailyCandles.data[dailyCandles.data.length - 1];
      candle.high = Math.max(candle.high, coin.price);
      candle.low = Math.min(candle.low, coin.price);
      candle.close = coin.price;
      candle.time = new Date();
    }
    coin.lastPriceUpdate = new Date();
    await coin.save();
  }
}

function startSimulator() {
  setInterval(runCoinSimulator, 5000);
}

module.exports = { startSimulator, runCoinSimulator };