// server/src/models/Summary.js
const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema(
  {
    // 🔗 גם פה Session אמיתי
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
  },
  { timestamps: true }
);

summarySchema.index({ sessionId: 1 });

module.exports = mongoose.model("Summary", summarySchema);