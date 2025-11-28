/**
 * Centralized Error Handler - Premium Refactor
 * Features: Logging, standardized error response, security
 */
exports.errorHandler = (err, req, res, next) => {
  console.error("[ERROR]", err.stack);
  res.status(500).json({ success: false, error: "Internal Server Error" });
};