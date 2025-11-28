/**
 * AuditLog - Demo, write-only log for admin/security/event actions
 */
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const auditLogSchema = new Schema(
  {
    action: { type: String, required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    details: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);