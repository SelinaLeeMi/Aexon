const router = require('express').Router();
const AuditLog = require('../models/AuditLog');
const { protect, adminOnly } = require('../middlewares/auth');

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: "Failed to load audit logs." });
  }
});

module.exports = router;