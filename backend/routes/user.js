/**
 * User Routes - Premium Professional Refactor
 */
const router = require("express").Router();
const { register, login, me, updateUsername } = require("../controllers/userController");
const { protect } = require("../middlewares/auth");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get profile
router.get("/me", protect, me);

// Update username
router.patch("/username", protect, updateUsername);

module.exports = router;