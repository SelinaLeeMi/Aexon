/**
 * News Routes - Professional Refactor
 */
const router = require("express").Router();
const { getCryptoNews, postCryptoNews } = require("../controllers/newsController");
const { protect, adminOnly } = require("../middlewares/auth");

// GET /api/news -- PUBLIC (no authentication required)
router.get("/", getCryptoNews);

// POST /api/news -- ADMIN ONLY (protected)
router.post("/", protect, adminOnly, postCryptoNews);

module.exports = router;