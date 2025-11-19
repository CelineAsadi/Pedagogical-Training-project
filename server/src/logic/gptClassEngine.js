// server/src/logic/gptClassEngine.js

const Session = require("../models/Session");
const LessonSettings = require("../models/LessonSettings");
const Event = require("../models/Event");
const Response = require("../models/Response");

// 👇 משתמשים במנוע ההפרעות החדש
const { decideDisruptions } = require("../services/gptDisruption.service");

/**
 * בונה צילום מצב כיתה (classContextSnapshot) עבור GPT
 * @param {String|ObjectId} sessionId
 * @param {Object} runtimeState - מצב בזמן אמת שנשמר ב-socket
 *   {
 *     students: [{ id, name, behaviorProfile, gender, seatId, seatPosition }],
 *     startedAt: Date,          // תחילת השיעור בצד ה-socket (אופציונלי)
 *     lastDecisionAt: Date|null // מתי בפעם האחרונה קראנו ל-GPT
 *   }
 */
async function buildClassroomSnapshot(sessionId, runtimeState = {}) {
  const session = await Session.findById(sessionId)
    .populate("lessonId")
    .lean();

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const lesson = session.lessonId;
  if (!lesson) {
    throw new Error(`LessonSettings not found for session ${sessionId}`);
  }

  // כל האירועים של תלמידים (שאלות / הפרעות)
  const events = await Event.find({ sessionId }).sort({ createdAt: 1 }).lean();

  // כל תגובות המורה (כולל "כלליות")
  const responses = await Response.find({ sessionId })
    .sort({ createdAt: 1 })
    .lean();

  // --- בניית טיימליין פנימי ---
  const timeline = [];

  for (const ev of events) {
    timeline.push({
      kind: "student_event",
      eventType: ev.eventType, // "question" | "disruption"
      studentId: ev.studentId,
      studentName: ev.studentName,
      content: ev.content,
      status: ev.status,
      at: ev.timestamp || ev.createdAt,
    });
  }

  for (const resp of responses) {
    timeline.push({
      kind: "teacher_turn",
      studentId: resp.studentId || null,
      eventId: resp.eventId || null,
      teacherText: resp.teacherText,
      responseTimeInSeconds: resp.responseTimeInSeconds,
      emotion: resp.emotion || null,
      isGeneral: resp.isGeneral || false,
      voiceFeatures: resp.voiceFeatures || null, // ⭐ כולל volume, pitch, tone
      at: resp.createdAt,
    });
  }

  // מיון הטיימליין לפי זמן
  timeline.sort((a, b) => new Date(a.at) - new Date(b.at));

  // ------------ חישובי זמנים ל-sessionMeta ------------
  const now = new Date();
  const startedAt = session.startTime || runtimeState.startedAt || now;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000)
  );

  let lastDisruptionAt = null;
  for (let i = timeline.length - 1; i >= 0; i--) {
    const item = timeline[i];
    if (item.kind === "student_event" && item.eventType === "disruption") {
      lastDisruptionAt = new Date(item.at);
      break;
    }
  }

  const timeSinceLastDisruptionSeconds = lastDisruptionAt
    ? Math.max(
        0,
        Math.floor((now.getTime() - lastDisruptionAt.getTime()) / 1000)
      )
    : null;

  // ------------ בניית students + seating ------------
  const students = (runtimeState.students || []).map((s) => ({
    id: s.id,
    name: s.name,
    behaviorProfile: s.behaviorProfile || "neutral",
    gender: s.gender || null,
    seatId: s.seatId || null,
  }));

  const seating = [];
  (runtimeState.students || []).forEach((s) => {
    if (s.seatId && s.seatPosition) {
      seating.push({
        seatId: s.seatId,
        position: {
          x: s.seatPosition.x,
          z: s.seatPosition.z,
        },
      });
    }
  });

  // ------------ recentEvents לפי הפורמט של הפרומפט ------------
  const MAX_RECENT = 40;
  const recentTimeline = timeline.slice(-MAX_RECENT);

  const recentEvents = recentTimeline.map((item) => {
    if (item.kind === "student_event") {
      return {
        type: "student_disruption", // גם שאלה וגם הפרעה – מודל יודע לפי meta.eventType
        timestamp: item.at,
        studentId: item.studentId,
        text: item.content,
        meta: {
          eventType: item.eventType, // "question" | "disruption"
          status: item.status,
        },
      };
    }

    // teacher_turn
    return {
      type: item.studentId ? "teacher_response" : "teacher_speech",
      timestamp: item.at,
      studentId: item.studentId || null,
      text: item.teacherText,
      meta: {
        responseTimeInSeconds: item.responseTimeInSeconds,
        emotion: item.emotion,
        isGeneral: item.isGeneral,
        voiceFeatures: item.voiceFeatures || null, // ⭐ כאן עובר volume/pitch/tone
      },
    };
  });

  // ------------ חישוב teacherStressLevelEstimate פשוט לפי tone ------------
  let teacherStressLevelEstimate = null;

  const toneScores = [];
  for (const item of recentTimeline) {
    if (item.kind !== "teacher_turn" || !item.voiceFeatures) continue;
    const tone = (item.voiceFeatures.tone || "").toLowerCase();

    let score;
    if (tone === "calm" || tone === "soft") score = 0.2;
    else if (tone === "neutral") score = 0.4;
    else if (tone === "firm") score = 0.6;
    else if (tone === "stressed" || tone === "loud") score = 0.8;
    else if (tone === "angry") score = 1.0;
    else score = 0.5; // unknown/other

    toneScores.push(score);
  }

  if (toneScores.length > 0) {
    const sum = toneScores.reduce((a, b) => a + b, 0);
    teacherStressLevelEstimate = sum / toneScores.length; // ערך בין 0–1
  }

  const snapshot = {
    sessionMeta: {
      sessionId: String(session._id),
      elapsedSeconds,
      timeSinceLastDisruptionSeconds,
    },
    classConfig: {
      className: lesson.className,
      lessonTopic: lesson.lessonTopic,
      durationMinutes: lesson.duration,
      classSize: lesson.classSize,
    },
    students,
    seating,
    recentEvents,
    loadIndicators: {
      teacherStressLevelEstimate, // ⭐ עכשיו באמת מחושב לפי טון המורה
      classNoiseLevelEstimate: null, // אפשר להוסיף בהמשך לפי כמות הפרעות
    },
  };

  return snapshot;
}

/**
 * פונקציה ראשית: מחליטה מה לעשות בסיבוב הבא (איזה הפרעות לייצר)
 *
 * @param {String|ObjectId} sessionId
 * @param {Object} runtimeState - אובייקט מצב מה-socket
 *
 * מחזירה:
 * {
 *   actions: [
 *     {
 *       studentId,
 *       behavior,
 *       label,
 *       utteranceText,
 *       delayMs
 *     }
 *   ],
 *   nextCheckInSeconds
 * }
 */
async function decideNextDisruptions(sessionId, runtimeState = {}) {
  // 1) בונים צילום מצב שמתאים לפרומפט של decideDisruptions
  const snapshot = await buildClassroomSnapshot(sessionId, runtimeState);

  // 2) מפעילים GPT
  const gptResult = await decideDisruptions(snapshot);

  // gptResult צפוי להיות:
  // { globalDecision, reason, disruptions: [ { studentId, behaviorProfile, type, label, utteranceText, ... } ] }

  const disruptions = Array.isArray(gptResult.disruptions)
    ? gptResult.disruptions
    : [];

  // 3) ממפים ל-actions שהמנוע שלנו מבין
  const actions = disruptions.map((d) => ({
    studentId: d.studentId,
    behavior: d.behaviorProfile || "neutral",
    label: d.label || "תלמיד",
    utteranceText: d.utteranceText || "",
    // אפשר להוסיף בעתיד delay לפי severity וכו'
    delayMs: 0,
  }));

  // 4) החלטה כל כמה זמן לקרוא שוב ל-GPT
  let nextCheckInSeconds = 15;
  if (gptResult.globalDecision === "none") {
    nextCheckInSeconds = 12 + Math.floor(Math.random() * 8); // 12–20
  } else if (gptResult.globalDecision === "single") {
    nextCheckInSeconds = 10 + Math.floor(Math.random() * 6); // 10–15
  } else if (gptResult.globalDecision === "multi") {
    nextCheckInSeconds = 15 + Math.floor(Math.random() * 10); // 15–24
  }

  return {
    actions,
    nextCheckInSeconds,
  };
}

module.exports = {
  decideNextDisruptions,
  buildClassroomSnapshot,
};
