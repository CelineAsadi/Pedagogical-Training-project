/**
 * Summary Model
 * This file defines the schema for storing aggregated, session-level
 * pedagogical summaries generated after a teaching session.
 * A summary consolidates all teacher responses and AI feedback
 * into high-level performance indicators and qualitative insights.
 */
const mongoose = require("mongoose");
const summarySchema = new mongoose.Schema(
  {
    sessionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true,
      },
    overallAvg: Number,
    timingAvg: Number,
    toneAvg: Number,
    pedagogyAvg: Number,
    avgResponseTime: Number,
    strength: {
      type: String, // GPT-generated summary of strengths
      default: null,
    },
    weakness: {
      type: String,  // GPT-generated summary of weaknesses
      default: null,
    },
  },
  { timestamps: true }
);
summarySchema.index({ sessionId: 1 });

module.exports = mongoose.model("Summary", summarySchema);