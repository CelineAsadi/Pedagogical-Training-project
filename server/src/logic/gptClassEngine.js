// server/src/logic/gptClassEngine.js

const Session = require("../models/Session");
const LessonSettings = require("../models/LessonSettings");
const Event = require("../models/Event");
const Response = require("../models/Response");
const User = require("../models/user.model");
const { decideDisruptions } = require("../services/gptDisruption.service");

/**
 * Build classroom snapshot for GPT
 */
async function buildClassroomSnapshot(sessionId, runtimeState = {}) {
  // Load Session + Lesson
  const session = await Session.findById(sessionId)
    .populate("lessonId")
    .lean();

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Lesson is inside session.lessonId
  const lesson = session.lessonId;
  if (!lesson) {
    throw new Error(`LessonSettings not found for session ${sessionId}`);
  }

  // ---------- Teacher Profile ----------
  const teacherId = session.userId || null;
  let teacherProfile = null;

  if (teacherId) {
    const teacher = await User.findById(teacherId).lean();
    if (teacher) {
      teacherProfile = {
        id: String(teacher._id),
        fullName: `${teacher.FName} ${teacher.LName}`,
        gender: teacher.Gender,
        classLevel: teacher.Classlevel,
        teachExpRange: teacher.TeachExp,
      };
    }
  }

  // ---------- Events ----------
  const events = await Event.find({ sessionId })
    .sort({ createdAt: 1 })
    .lean();

  const responses = await Response.find({ sessionId })
    .sort({ createdAt: 1 })
    .lean();

  // ---------- Timeline ----------
  const timeline = [];

  for (const ev of events) {
    timeline.push({
      kind: "student_event",
      eventType: ev.eventType,
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
      eventId: resp.eventId || null,
      studentId: resp.studentId || null,
      teacherText: resp.teacherText,
      responseTimeInSeconds: resp.responseTimeInSeconds,
      emotion: resp.emotion || null,
      isGeneral: resp.isGeneral || false,
      voiceFeatures: resp.voiceFeatures || null,
      at: resp.createdAt,
    });
  }

  timeline.sort((a, b) => new Date(a.at) - new Date(b.at));

  // ---------- Time calculations ----------
  const now = new Date();
  const startedAt = session.startTime || runtimeState.startedAt || now;

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - new Date(startedAt)) / 1000)
  );

  let lastDisruptionAt = null;
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (
      timeline[i].kind === "student_event" &&
      timeline[i].eventType === "disruption"
    ) {
      lastDisruptionAt = new Date(timeline[i].at);
      break;
    }
  }

  const timeSinceLastDisruptionSeconds = lastDisruptionAt
    ? Math.max(0, Math.floor((now - lastDisruptionAt) / 1000))
    : null;

  // ---------- Students & seating ----------
  const students = (runtimeState.students || []).map((s) => ({
    id: s.id,
    name: s.name,
    behaviorProfile: s.behaviorProfile || "neutral",
    gender: s.gender || null,
    seatId: s.seatId || null,
  }));

  const seating = (runtimeState.students || [])
    .filter((s) => s.seatId && s.seatPosition)
    .map((s) => ({
      seatId: s.seatId,
      position: {
        x: s.seatPosition.x,
        z: s.seatPosition.z,
      },
    }));

  // ---------- Recent Events ----------
  const MAX_RECENT = 40;
  const recentEvents = timeline.slice(-MAX_RECENT).map((item) => {
    if (item.kind === "student_event") {
      return {
        type: "student_disruption",
        timestamp: item.at,
        studentId: item.studentId,
        text: item.content,
        meta: {
          eventType: item.eventType,
          status: item.status,
        },
      };
    }

    return {
      type: item.studentId ? "teacher_response" : "teacher_speech",
      timestamp: item.at,
      studentId: item.studentId || null,
      text: item.teacherText,
      meta: {
        responseTimeInSeconds: item.responseTimeInSeconds,
        emotion: item.emotion,
        isGeneral: item.isGeneral,
        voiceFeatures: item.voiceFeatures,
        replyToEventId: item.eventId,
      },
    };
  });

  // ---------- Stress Level ----------
  let teacherStressLevelEstimate = null;

  const toneScores = recentEvents
    .filter((ev) => ev.type === "teacher_response" && ev.meta.voiceFeatures)
    .map((ev) => {
      const tone = ev.meta.voiceFeatures.tone?.toLowerCase() || "";

      if (tone === "calm" || tone === "soft") return 0.2;
      if (tone === "neutral") return 0.4;
      if (tone === "firm") return 0.6;
      if (tone === "stressed" || tone === "loud") return 0.8;
      if (tone === "angry") return 1.0;

      return 0.5;
    });

  if (toneScores.length > 0) {
    teacherStressLevelEstimate =
      toneScores.reduce((a, b) => a + b) / toneScores.length;
  }

  // ---------- FINAL SNAPSHOT ----------
  return {
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
    teacherProfile,
    students,
    seating,
    recentEvents,
    loadIndicators: {
      teacherStressLevelEstimate,
      classNoiseLevelEstimate: null,
    },
  };
}

/**
 * Main decision function
 */
/**
 * 🧠 מחליט מה לעשות בסיבוב הבא של ההפרעות — ללא "הפרעה מאולצת"
 *     אבל עם לוגיקה שתאפשר להפרעות להתחיל באופן טבעי.
 */
async function decideNextDisruptions(sessionId, runtimeState = {}) {

  // ---------------------------------------------------------------
  // 1) BUILD SNAPSHOT
  // ---------------------------------------------------------------
  const snapshot = await buildClassroomSnapshot(sessionId, runtimeState);
  if (!snapshot) {
    console.warn("⚠️ Snapshot missing");
    return { actions: [], nextCheckInSeconds: 8 };
  }

  const elapsed = snapshot?.sessionMeta?.elapsedSeconds || 0;
  const recentEvents = snapshot?.recentEvents || [];

  const teacherHasSpoken = recentEvents.some(
    ev => ev.type === "teacher_speech" || ev.type === "teacher_response"
  );

  const lastStudentEvent = [...recentEvents].reverse().find(
    ev => ev.type === "student_disruption"
  );
  const hasAnyDisruptions = Boolean(lastStudentEvent);

  // ---------------------------------------------------------------
  // 2) NORMALIZE BEHAVIOR PROFILES
  // ---------------------------------------------------------------
  const validProfiles = [
    "attentive", "talker", "defiant", "sensitive",
    "withdrawn", "conflicts", "sarcastic", "hyperactive", "neutral"
  ];

  snapshot.students = snapshot.students.map(s => ({
    ...s,
    behaviorProfile: validProfiles.includes(s.behaviorProfile)
      ? s.behaviorProfile
      : "neutral",
  }));

  // ---------------------------------------------------------------
  // 3) GPT DECISION
  // ---------------------------------------------------------------
  let gptResult;
  try {
    gptResult = await decideDisruptions(snapshot);
  } catch (err) {
    console.error("❌ GPT disruption engine error:", err);
    return { actions: [], nextCheckInSeconds: 10 };
  }

  let disruptions = Array.isArray(gptResult?.disruptions)
    ? gptResult.disruptions
    : [];

  // ---------------------------------------------------------------
  // 4) ALLOW DISRUPTIONS EARLY IF CLASS IS SILENT
  // ---------------------------------------------------------------
  const allowEarlyDisruptions =
    (!teacherHasSpoken && !hasAnyDisruptions && elapsed > 5);

  const allowDisruptionBoost =
    (gptResult.globalDecision === "none" && allowEarlyDisruptions);

  if (allowDisruptionBoost && disruptions.length === 0) {
    const anyStudent = snapshot.students[0];
    if (anyStudent) {
      disruptions = [
        {
          studentId: anyStudent.id,
          behaviorProfile: anyStudent.behaviorProfile,
          type: "disruption",
          label: "מתלבט",
          utteranceText: "אממ… לא הבנתי מאיפה להתחיל."
        }
      ];
      console.log("✨ Boosted disruption because class is too quiet.");
    }
  }

  // ---------------------------------------------------------------
  // 5) MAP TO ACTIONS
  // ---------------------------------------------------------------
  const actions = disruptions.map((d, idx) => ({
    studentId: d.studentId,
    behavior: d.behaviorProfile || "neutral",
    label: d.label || "תלמיד",
    utteranceText: d.utteranceText || "",
    eventType: d.type === "question" ? "question" : "disruption",
    delayMs: idx * 350,
  }));

  // ---------------------------------------------------------------
  // 6) NEXT CHECK TIME
  // ---------------------------------------------------------------
  let nextCheckInSeconds = 6;

  switch (gptResult.globalDecision) {
    case "none":
      nextCheckInSeconds = 5 + Math.floor(Math.random() * 3); // 5–7
      break;
    case "single":
      nextCheckInSeconds = 4 + Math.floor(Math.random() * 2); // 4–5
      break;
    case "multi":
      nextCheckInSeconds = 6 + Math.floor(Math.random() * 4); // 6–9
      break;
  }

  return { actions, nextCheckInSeconds };
}



module.exports = {
  decideNextDisruptions,
  buildClassroomSnapshot,
};
