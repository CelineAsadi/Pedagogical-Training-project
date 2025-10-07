const mongoose = require("mongoose");

const lessonSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // משתמש אחד – סט אחד של הגדרות
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
}, { timestamps: true });

const LessonSettings = mongoose.model("LessonSettings", lessonSettingsSchema);
module.exports = LessonSettings;
