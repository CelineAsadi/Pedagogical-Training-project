/**
 * Session Model
 * This file defines the schema for teaching sessions.
 * A session represents a single live teaching simulation
 * based on a predefined classroom (lesson) configuration.
 * Sessions track timing, ownership, and lifecycle state
 * from start to completion.
 */
const mongoose = require("mongoose");
const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "LessonSettings", required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" },
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);