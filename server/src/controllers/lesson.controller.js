/**
 * Lesson & Classroom Controller
 * -----------------------------
 * This file manages lesson/classroom configurations for users.
 *
 * Responsibilities:
 * - Create and store classroom (lesson) settings
 * - Validate classroom composition
 * - Retrieve lesson settings by class name
 * - List user classrooms with pagination
 * - Create predefined (basic) classrooms
 * - Fetch a class together with its sessions and AI summaries
 *
 * This controller connects lesson configuration with sessions
 * and post-session summaries.
 */
const LessonSettings = require("../models/LessonSettings");
const Session = require("../models/Session");
const Summary = require("../models/Summary");
/**
 * Creates and saves a new classroom (lesson configuration) for the user.
 * Validates required fields and ensures the total number of students
 * matches the declared class size.
 */
 exports.saveLessonSettings = async (req, res) => {
 try {
    const userId = req.user._id;
    const { className, classSize, duration, studentTypes , lessonTopic } = req.body;
    console.log("Creating class for user:", userId, className);
    if (!className || !classSize || !duration || !studentTypes  ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const totalStudents = studentTypes.reduce((sum, t) => sum + t.count, 0);
    if (totalStudents !== classSize) {
      return res.status(400).json({ message: "Total students must equal class size" });
    }
    const newLesson = new LessonSettings({
      userId,
      className: className.trim(),
      classSize,
      duration,
      studentTypes,
      lessonTopic: lessonTopic ? lessonTopic.trim() : "",
    });
    await newLesson.save();
    res.status(201).json({
      message: "New class created successfully ✅",
      lesson: newLesson,
    });
  } catch (err) {
    console.error("❌ Error creating class:", err);
    if (err.code === 11000) {
      return res.status(400).json({
        message: "A class with this name already exists. Please choose another name.",
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Retrieves lesson settings for a specific classroom by name.
 * If no settings are found, a default classroom indicator is returned.
 */
 exports.getLessonSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { className } = req.query; 
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
 * Retrieves a paginated list of classrooms belonging to the user.
 * Supports pagination to efficiently handle large numbers of classes.
 */
exports.getUserClasses = async (req, res) => {
  try {
    const userId = req.user._id;
    // 📌 Default pagination values
    const page = parseInt(req.query.page) || 1;     // page number, default 1
    const limit = parseInt(req.query.limit) || 5;   // 5 classes per page
    const skip = (page - 1) * limit;
    // 🔍 Count total classes for pagination
    const totalClasses = await LessonSettings.countDocuments({ userId });
    // 📥 Fetch only one page
    const classes = await LessonSettings.find({ userId })
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit);
    res.status(200).json({
      page,
      limit,
      totalClasses,
      totalPages: Math.ceil(totalClasses / limit),
      hasMore: page * limit < totalClasses,
      classes,
    });
  } catch (err) {
    console.error("❌ Error getting user classes:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Creates a predefined "basic" classroom for quick start.
 * Automatically assigns:
 * - Default class size
 * - Default duration
 * - Predefined student behavior distribution
 * Class name is auto-generated (basic-1, basic-2, etc.).
 */
exports.createBasicClass = async (req, res) => {
  try {
    const userId = req.user._id;
    const { lessonTopic } = req.body;
    const count = await LessonSettings.countDocuments({
      userId,
      className: { $regex: /^basic/i },
    });
    const className = `basic-${count + 1}`;
    const newLesson = new LessonSettings({
      userId,
      className,
      lessonTopic: lessonTopic ? lessonTopic.trim() : "",
      classSize: 15,
      duration: 5,
      studentTypes: [
        { name: "Attentive", count: 3 },
        { name: "Talker", count: 2 },
        { name: "Defiant", count: 2 },
        { name: "Sensitive", count: 2 },
        { name: "Withdrawn", count: 2 },
        { name: "Conflicts", count: 1 },
        { name: "Sarcastic", count: 1 },
        { name: "Hyperactive", count: 1 },
        { name: "Neutral", count: 1 },
      ],
    });
    await newLesson.save();
    res.status(201).json({
      message: "✅ Basic classroom created",
      className,
      lessonId: newLesson._id.toString(), 
    });
  } catch (err) {
    console.error("❌ Error creating basic class:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
const mongoose = require("mongoose");

/**
 * Retrieves a classroom together with its sessions and AI-generated summaries.
 * For a given class:
 * - Fetches all sessions (newest first)
 * - Fetches summaries related to those sessions
 * - Merges each session with its corresponding summary
 */
exports.getClassWithSummaries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { classId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid classId" });
    }
    const lesson = await LessonSettings.findOne({
      _id: classId,
      userId,
    });
    if (!lesson) {
      return res.status(404).json({ message: "Class not found" });
    }
    // 🔥 FIX: correct ObjectId conversion
    const sessions = await Session.find({
      lessonId: new mongoose.Types.ObjectId(classId),
      userId
    }).sort({ createdAt: -1 });

    if (sessions.length === 0) {
      return res.json({
        sessions: [],
        summaries: [],
        message: "No sessions found for this class.",
      });
    }
    const sessionIds = sessions.map(s => s._id);
    const summaries = await Summary.find({
      sessionId: { $in: sessionIds },
    });
    const result = sessions.map(session => ({
      ...session.toObject(),
      summary: summaries.find(s => String(s.sessionId) === String(session._id)) || null
    }));
    res.json({ sessions: result });
  } catch (err) {
    console.error("❌ Error fetching class with summaries:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
