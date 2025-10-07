const LessonSettings = require("../models/LessonSettings");

/**
 * שמירת הגדרות כיתה למשתמש
 */
exports.saveLessonSettings = async (req, res) => {
  try {
    const userId = req.user._id; // מתקבל מה-middleware של אימות JWT
    const { classSize, duration, studentTypes } = req.body;
    console.log("=== Saving Lesson Settings ===");
console.log("req.user:", req.user);
console.log("req.body:", req.body);


    // בדיקה שחייבים לשלוח את כל הנתונים
    if (!classSize || !duration || !studentTypes) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // חישוב סכום כל התלמידים
    const totalStudents = studentTypes.reduce((sum, t) => sum + t.count, 0);
    if (totalStudents !== classSize) {
      return res.status(400).json({ message: "Total students must equal class size" });
    }

    // עדכון או יצירה של ההגדרות למשתמש
    const settings = await LessonSettings.findOneAndUpdate(
      { userId },
      { classSize, duration, studentTypes },
      { new: true, upsert: true } // אם אין - צור חדש
    );

    res.status(200).json({
      message: "Lesson settings saved successfully ✅",
      settings,
    });
  } catch (err) {
    console.error("Error saving lesson settings:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * שליפת ההגדרות הקיימות של המשתמש
 */
exports.getLessonSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = await LessonSettings.findOne({ userId });

    if (!settings) {
      return res.json({ default: true, message: "No settings found — using default classroom" });
    }

    res.status(200).json(settings);
  } catch (err) {
    console.error("Error getting lesson settings:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
