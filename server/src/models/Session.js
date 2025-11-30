const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "LessonSettings", required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" },
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);