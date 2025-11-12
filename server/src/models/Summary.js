const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },

  overallAvg: Number,
  timingAvg: Number,
  toneAvg: Number,
  pedagogyAvg: Number,
  avgResponseTime: Number, // ממוצע זמן תגובה
}, { timestamps: true });

summarySchema.index({ sessionId: 1 });

module.exports = mongoose.model("Summary", summarySchema);
