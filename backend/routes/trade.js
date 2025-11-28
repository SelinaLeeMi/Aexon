/**
 * Trade Routes - Premium Professional Refactor
 */
const router = require("express").Router();
const { protect } = require("../middlewares/auth");
const { placeTrade, getMyTrades } = require("../controllers/tradeController");

router.post("/place", protect, placeTrade);
router.get("/my", protect, getMyTrades);

module.exports = router;