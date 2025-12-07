const router = require("express").Router();
const coinCtrl = require("../controllers/coinController");

// GET /api/coin
router.get("/", coinCtrl.getCoins);

// GET /api/coin/:symbol
router.get("/:symbol", coinCtrl.getCoin);

module.exports = router;
