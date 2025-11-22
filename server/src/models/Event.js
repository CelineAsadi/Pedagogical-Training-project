// server/src/models/Event.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    // 🧠 כאן עוברים ל-String ולא ObjectId
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
    // 👇 חדש – מזהה ה־disruption מהסוקט/פרונט
    disruptionId: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// 👇 אינדקס ייחודי: באותו session אי אפשר שתי הפרעות עם אותו disruptionId
eventSchema.index({ sessionId: 1, disruptionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Event", eventSchema);