/**
 * Setting Model
 * - Single-document store for admin-configurable site settings.
 */
const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    siteTitle: { type: String, default: "Aexon Exchange" },
    tradeMode: { type: String, enum: ["live", "maintenance", "read-only"], default: "live" },
    supportEmail: { type: String, default: "" },
    additional: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);