/**
 * Teacher Response Controller
 * ---------------------------
 * This file handles saving teacher responses during a live session.
 *
 * It connects teacher responses to student events (questions or disruptions),
 * normalizes voice features, updates event status, and generates AI-based
 * pedagogical feedback using GPT analysis.
 *
 * Main responsibilities:
 * - Store teacher responses
 * - Link responses to events
 * - Calculate response time
 * - Analyze response quality using AI
 * - Persist structured feedback
 */
const ResponseModel = require("../models/Response");
const FeedbackModel = require("../models/Feedback");
const { analyzeTeacherResponse } = require("../services/gptFeedback.service");
const {createEventFromDisruption,} = require("./event.controller");

/**
 * Saves a teacher's verbal/textual response during a session.
 * This function:
 * - Validates required input
 * - Normalizes voice features
 * - Creates or links an Event (question/disruption)
 * - Stores the teacher response
 * - Updates event status
 * - Triggers AI-based pedagogical feedback analysis
 */
async function saveTeacherResponse(req, res) {
  try {
    const { sessionId, teacherText, voiceFeatures, disruption } = req.body;
    if (!teacherText || !sessionId) {
      return res.status(400).json({
        ok: false,
        message: "must fileds sessionId & teacherText",
      });
    }
    const normalizedVoiceFeatures = {
      volume:
        typeof voiceFeatures?.volume === "number"
          ? voiceFeatures.volume
          : null,
      pitch:
        typeof voiceFeatures?.pitch === "number"
          ? voiceFeatures.pitch
          : null,
      tone:
        typeof voiceFeatures?.tone === "string"
          ? voiceFeatures.tone
          : null,
    };
    const { eventDoc, responseTimeInSeconds } =
      await createEventFromDisruption({ sessionId, disruption });
    const responseDoc = await ResponseModel.create({
      sessionId, 
      eventId: eventDoc ? eventDoc._id : undefined,
      teacherText,
      responseTimeInSeconds,
      voiceFeatures: normalizedVoiceFeatures,
      isGeneral: !eventDoc,
    });
    if (eventDoc) {
      eventDoc.status = "answered";
      await eventDoc.save();
    }
    let feedbackDoc = null;
    try {
      const gptResult = await analyzeTeacherResponse({
        disruption: disruption || null,
        teacherText,
        voiceFeatures: normalizedVoiceFeatures,
      });
      feedbackDoc = await FeedbackModel.create({
        sessionId,
        responseId: responseDoc._id,
        scoring: gptResult.scoring,
        systemFeedback: gptResult.feedbackText,
      });
    } catch (gptErr) {
      console.error("⚠️ GPT analyzeTeacherResponse failed:", gptErr);
    }
    return res.json({
      ok: true,
      sessionId,
      teacherText,
      disruption: disruption || null,
      voiceFeatures: normalizedVoiceFeatures,
      savedEvent: eventDoc,
      savedResponse: responseDoc,
      savedFeedback: feedbackDoc,
    });
  } catch (err) {
    console.error("❌ Error in saveTeacherResponse:", err);
    return res.status(500).json({
      ok: false,
      message: "Internal server error in teacher-response",
      details: err.message,
    });
  }
}

module.exports = {
  saveTeacherResponse,
};
