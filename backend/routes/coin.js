const router = require("express").Router();
const { getCoins } = require("../controllers/coinController");

// Get all coins, paginated, real-time from CoinGecko
router.get("/", getCoins);

module.exports = router;