
/**
 * Event Model
 * This file defines the schema for student-generated events
 * during a teaching session.
 * Events represent meaningful classroom interactions such as:
 * - Student questions
 * - Behavioral disruptions
 * Each event is linked to a session and may later be answered
 * by a teacher response.
 */
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    sessionId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },
    studentId: { type: String, required: true },
    studentName: String,
    eventType: {
      type: String,
      enum: ["question", "disruption"],
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["open", "answered"],
      default: "open",
    },
    disruptionId: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ sessionId: 1, disruptionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Event", eventSchema);