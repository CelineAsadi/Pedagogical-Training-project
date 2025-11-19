// server/src/controllers/session.controller.js

const Session = require("../models/Session");
const LessonSettings = require("../models/LessonSettings");

/**
 * ▶️ יצירת Session חדש לשיעור
 * body: { lessonId }
 */
exports.startSession = async (req, res) => {
  try {
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        ok: false,
        message: "lessonId is required",
      });
    }

    // במקום req.user – לוקחים את המשתמש מתוך ה-LessonSettings
    const lesson = await LessonSettings.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        ok: false,
        message: "Lesson not found",
      });
    }

    const userId = lesson.userId; // 👈 זה בעל הכיתה

    const session = await Session.create({
      userId,
      lessonId: lesson._id,
      startTime: new Date(),
      status: "in-progress",
    });

    return res.status(201).json({
      ok: true,
      sessionId: session._id.toString(), // זה מה שנשלח לקליינט
      lessonId: lesson._id.toString(),
    });
  } catch (err) {
    console.error("❌ Error in startSession:", err);
    return res.status(500).json({
      ok: false,
      message: "Internal server error in startSession",
      details: err.message,
    });
  }
  console.log("🔥 startSession HIT:", req.body);

};
