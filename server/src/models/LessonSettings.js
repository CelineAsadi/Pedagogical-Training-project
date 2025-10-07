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
}, { timestamps: true });

// ⚙️ אינדקס חדש: שם כיתה ייחודי למשתמש עצמו
lessonSettingsSchema.index({ userId: 1, className: 1 }, { unique: true });

const LessonSettings = mongoose.model("LessonSettings", lessonSettingsSchema);
module.exports = LessonSettings;
