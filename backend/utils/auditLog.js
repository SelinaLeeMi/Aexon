// models/AuditLog with helper (write-only)
const AuditLog = require("../models/AuditLog");
/**
 * Write audit event.
 */
exports.createAudit = async (action, actorId, details = {}) => {
  if (!AuditLog) return;
  await AuditLog.create({
    action,
    actor: actorId,
    details: details,
    createdAt: new Date(),
  });
};