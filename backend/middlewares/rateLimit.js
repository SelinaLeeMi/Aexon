const rateLimit = require('express-rate-limit');

/**
 * Global limiter: 200 requests / 15 minutes per IP
 */
exports.globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Sensitive limiter: 30 requests / 15 minutes per IP
 */
exports.sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: "Too many actions from this IP. Try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
