/**
 * Session Controller
 * ------------------
 * This file manages the lifecycle of teaching sessions.
 *
 * Responsibilities:
 * - Start a new teaching session for a lesson
 * - Retrieve the most recent sessions with summaries and scores
 *
 * The controller connects lessons, sessions, and AI-generated summaries
 * to support progress tracking and performance analysis.
 */
const mongoose = require("mongoose");
const Summary = require("../models/Summary");
const Session = require("../models/Session");
const LessonSettings = require("../models/LessonSettings");

/**
 * Starts a new teaching session for a given lesson.
 * Creates a new session document with an initial "in-progress" status
 * and records the start time.
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
    const lesson = await LessonSettings.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        ok: false,
        message: "Lesson not found",
      });
    }
    const userId = lesson.userId; 
    const session = await Session.create({
      userId,
      lessonId: lesson._id,
      startTime: new Date(),
      endTime: null, 
      status: "in-progress",
    });
    return res.status(201).json({
      ok: true,
      sessionId: session._id.toString(), 
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

/**
 * Retrieves the current session and the two sessions immediately before it.
 * For each session, the function:
 * - Loads the associated lesson (classroom)
 * - Loads the AI-generated summary (if available)
 * - Returns a compact overview including score and class name
 */
exports.getLastThreeSessions = async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log("\n============================");
    console.log("📌 REQUEST last-three for:", sessionId);
    console.log("============================\n");
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      console.log("❌ Invalid ObjectId:", sessionId);
      return res.status(400).json({ message: "Invalid sessionId" });
    }
    // 1️⃣ GET current session
    const current = await Session.findById(sessionId);
    if (!current) {
      console.log("❌ Session not found for id:", sessionId);
      return res.status(404).json({ message: "Session not found" });
    }
    console.log("📌 Current session createdAt:", current.createdAt);
    console.log("📌 Current lessonId:", current.lessonId);
    console.log("📌 Current userId:", current.userId);
    // 2️⃣ Find 2 previous sessions (same user)
    const previousTwo = await Session.find({
      userId: current.userId,
      createdAt: { $lt: current.createdAt }
    })
      .sort({ createdAt: -1 })
      .limit(2);
    console.log("📌 Previous sessions count:", previousTwo.length);
    const all = [current, ...previousTwo];
    // 3️⃣ Get summaries
    const summaries = await Summary.find({
      sessionId: { $in: all.map((s) => s._id) }
    });
    console.log("📌 Summaries found:", summaries.length);
    // 4️⃣ Load lesson settings for each session
    const lessonIds = all.map((s) => s.lessonId);
    console.log("📌 Lesson IDs:", lessonIds);
    const lessons = await LessonSettings.find({
      _id: { $in: lessonIds }
    });
    console.log("📌 Lessons found:", lessons.length);
    // 5️⃣ Merge all info
    const response = all.map((s) => {
      const lesson = lessons.find(
        (l) => String(l._id) === String(s.lessonId)
      );
      const summary = summaries.find(
        (sum) => String(sum.sessionId) === String(s._id)
      );
      return {
        sessionId: s._id,
        createdAt: s.createdAt,
        className: lesson ? lesson.className : "Unknown Class",
        score: summary ? summary.overallAvg : null,
        summary
      };
    });
    return res.json({ sessions: response });
  } catch (err) {
    console.log("\n❌ ERROR in getLastThreeSessions");
    console.log(err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};