/**
 * User Routes - Clean Final Version
 */
const router = require("express").Router();
const { me, updateUsername } = require("../controllers/userController");
const { protect } = require("../middlewares/auth");

// Get profile
router.get("/me", protect, me);

// Update username
router.patch("/username", protect, updateUsername);

module.exports = router;
