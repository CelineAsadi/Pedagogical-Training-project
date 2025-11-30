// server/src/controllers/feedback.controller.js

const ResponseModel = require("../models/Response");
const FeedbackModel = require("../models/Feedback");
const { analyzeTeacherResponse } = require("../services/gptFeedback.service");
const {
  createEventFromDisruption,
} = require("./event.controller");




// POST /api/feedback/teacher-response
async function saveTeacherResponse(req, res) {
  try {
    const { sessionId, teacherText, voiceFeatures, disruption } = req.body;

    if (!teacherText || !sessionId) {
      return res.status(400).json({
        ok: false,
        message: "sessionId ו-teacherText הם שדות חובה",
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

        // ✨ יצירת Event במונגו הועברה ל-event.controller.js
    const { eventDoc, responseTimeInSeconds } =
      await createEventFromDisruption({ sessionId, disruption });


    const responseDoc = await ResponseModel.create({
      sessionId, // 🔗 Session אמיתי
      eventId: eventDoc ? eventDoc._id : undefined,
     // studentId: disruption?.studentId || null,
      teacherText,
      //audioPath: null,
      responseTimeInSeconds,
      //emotion: null,
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
