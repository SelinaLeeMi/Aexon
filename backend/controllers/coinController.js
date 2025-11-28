const axios = require("axios");

const wantedIds = ['bitcoin', 'ethereum', 'tether', 'usd-coin'];

exports.getCoins = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          ids: wantedIds.join(','),
          order: "market_cap_desc",
          sparkline: false,
          price_change_percentage: "24h",
        },
      }
    );
    const coins = Array.isArray(data) ? data.map((coin) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      iconUrl: coin.image,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      total_volume: coin.total_volume,
      image: coin.image,
      id: coin.id,
    })) : [];
    res.json({
      success: true,
      msg: "Fetched coins",
      data: coins,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch coins",
      data: [],
    });
  }
};