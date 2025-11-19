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
  },
  { timestamps: true }
);

// אינדקס לפי sessionId כדי שיהיה קל לשלוף לפי שיעור
eventSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Event", eventSchema);
