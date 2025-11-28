/**
 * Referral Routes - claim endpoint with validation and rate limit
 */
const router = require("express").Router();
const { protect } = require("../middlewares/auth");
const { claimReferral } = require("../controllers/referralController");
const { validateReferralClaim } = require("../middlewares/validators");
const { sensitiveLimiter } = require("../middlewares/rateLimit");

router.post("/claim", protect, sensitiveLimiter, validateReferralClaim, claimReferral);

module.exports = router;