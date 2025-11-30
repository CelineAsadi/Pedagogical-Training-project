// server/src/models/Response.js
const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    // 🧠 גם כאן String במקום ObjectId
    sessionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true,
      },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    studentId: { type: String },

    teacherText: { type: String, required: true },

    audioPath: String,
    responseTimeInSeconds: Number,

    voiceFeatures: {
      volume: { type: Number },
      pitch: { type: Number },
      tone: { type: String }, // "calm" | "stressed" | ...
    },

    emotion: {
      label: String,
      confidence: Number,
    },

    isGeneral: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// גם כאן אינדקס לפי sessionId
responseSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Response", responseSchema);