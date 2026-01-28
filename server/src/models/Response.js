/**
 * Response Model
 * This file defines the schema for teacher responses during a teaching session.
 * A response represents a teacher's verbal or textual reaction to:
 * - A specific student event (question or disruption), or
 * - The class in general (no specific triggering event)
 * Responses may include timing metrics and voice analysis features,
 * and they serve as the basis for AI-generated pedagogical feedback.
 */
const mongoose = require("mongoose");
const responseSchema = new mongoose.Schema(
  {
    sessionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true,
      },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    teacherText: { type: String, required: true },
    responseTimeInSeconds: Number,
    voiceFeatures: {
      volume: { type: Number },
      pitch: { type: Number },
      tone: { type: String }, // "calm" | "stressed" | ...
    },
    isGeneral: { type: Boolean, default: false },
  },
  { timestamps: true }
);
responseSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Response", responseSchema);
