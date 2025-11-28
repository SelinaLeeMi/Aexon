/**
 * Audit Logger Middleware - Professional Refactor
 */
const AuditLog = require("../models/AuditLog");

// Log admin actions for audit trail
async function auditLogger({
  adminId,
  action,
  targetType,
  targetId,
  details,
  ip,
  note,
}) {
  try {
    await AuditLog.create({
      adminId,
      action,
      targetType,
      targetId,
      details,
      ip,
      note,
      timestamp: new Date(),
    });
  } catch (err) {
    // Log error but never interrupt main flow
    console.error("Audit logging failed:", err);
  }
}

module.exports = auditLogger;