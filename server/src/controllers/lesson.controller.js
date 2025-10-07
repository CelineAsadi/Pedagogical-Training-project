const LessonSettings = require("../models/LessonSettings");

/**
 * ויצירה שמירת הגדרות כיתה למשתמש
 */
exports.saveLessonSettings = async (req, res) => {
 try {
    const userId = req.user._id;
    const { className, classSize, duration, studentTypes } = req.body;

    console.log("Creating class for user:", userId, className);

    // בדיקות תקינות בסיסיות
    if (!className || !classSize || !duration || !studentTypes) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const totalStudents = studentTypes.reduce((sum, t) => sum + t.count, 0);
    if (totalStudents !== classSize) {
      return res.status(400).json({ message: "Total students must equal class size" });
    }

    // יצירת כיתה חדשה
    const newLesson = new LessonSettings({
      userId,
      className: className.trim(),
      classSize,
      duration,
      studentTypes,
    });

    await newLesson.save();

    res.status(201).json({
      message: "New class created successfully ✅",
      lesson: newLesson,
    });
  } catch (err) {
    console.error("❌ Error creating class:", err);

    // טיפול במקרה של שם כיתה כפול
    if (err.code === 11000) {
      return res.status(400).json({
        message: "A class with this name already exists. Please choose another name.",
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * שליפת כיתה ספציפית  למשתמש
 */
exports.getLessonSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { className } = req.query; // נוסיף תמיכה בפרמטר מה-URL

    if (!className) {
      return res.status(400).json({ message: "Class name is required" });
    }

    const settings = await LessonSettings.findOne({ userId, className: className.toLowerCase().trim() });

    if (!settings) {
      return res.json({ default: true, message: "No settings found — using default classroom" });
    }

    res.status(200).json(settings);
  } catch (err) {
    console.error("Error getting lesson settings:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
/**
 * ✅ שליפת כל הכיתות של המשתמש
 */
exports.getUserClasses = async (req, res) => {
  try {
    const userId = req.user._id;

    const classes = await LessonSettings.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      message: `Found ${classes.length} classes for user.`,
      classes,
    });
  } catch (err) {
    console.error("❌ Error getting user classes:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};