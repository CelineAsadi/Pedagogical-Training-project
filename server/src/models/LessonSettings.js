/**
 * LessonSettings Model
 * This file defines the schema for storing classroom (lesson) configurations
 * created by users.
 * Each document represents a reusable classroom setup that defines
 * lesson duration, class size, student behavior distribution,
 * and the pedagogical context of the lesson.
 */
const mongoose = require("mongoose");
const lessonSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  className: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  classSize: {
    type: Number,
    required: true,
    min: 5,
    max: 15,
  },
  duration: {
    type: Number,
    required: true,
    min: 5,
    max: 10,
  },
  studentTypes: [
    {
      name: { type: String, required: true },
      count: { type: Number, required: true, min: 0 },
    },
  ],
   lessonTopic: { type: String, default: "", required: true },
}, { timestamps: true });
lessonSettingsSchema.index({ userId: 1, className: 1 }, { unique: true });
lessonSettingsSchema.index({ userId: 1, createdAt: -1 });

const LessonSettings = mongoose.model("LessonSettings", lessonSettingsSchema);
module.exports = LessonSettings;