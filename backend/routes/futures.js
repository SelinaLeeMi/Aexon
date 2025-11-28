/**
 * Futures Routes - Premium Professional Refactor
 */
const router = require("express").Router();
const fut = require("../controllers/FuturesController");
const { protect } = require("../middlewares/auth");

router.post("/futures/open", protect, fut.openFuturesPosition);
router.post("/futures/close", protect, fut.closeFuturesPosition);
router.get("/futures/my-positions", protect, fut.listMyFuturesPositions);

module.exports = router;