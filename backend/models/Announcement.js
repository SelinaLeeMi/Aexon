/**
 * Announcement Model - Demo
 */
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const announcementSchema = new Schema(
  {
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["info", "warning", "system"], default: "info" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);