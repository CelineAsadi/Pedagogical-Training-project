// server/src/models/Feedback.js
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    // 🧠 String – אותו UUID מהקליינט
   sessionId:{
       type: mongoose.Schema.Types.ObjectId,
       ref: "Session",
       required: true,
     },

    responseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Response",
      required: true,
    },

    scoring: {
      timing: { type: Number, min: 0, max: 10 },
      tone: { type: Number, min: 0, max: 10 },
      pedagogy: { type: Number, min: 0, max: 10 },
      overall: { type: Number, min: 0, max: 10 },
    },

    systemFeedback: { type: String },
  },
  { timestamps: true }
);

feedbackSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Feedback", feedbackSchema);