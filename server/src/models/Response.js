const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  studentId: { type: String },
  teacherText: String,
  audioPath: String,
  responseTimeInSeconds: Number,
  emotion: {
    label: String,
    confidence: Number,
  },
  isGeneral: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Response", responseSchema);
