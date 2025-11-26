// server/src/socket/lessonSocket.js

const { Server } = require("socket.io");
const { decideNextDisruptions } = require("../logic/gptClassEngine");
const EventModel = require("../models/Event");


// ננהל מצב זיכרון לכל sessionId
// {
//   [sessionId]: {
//      students: [{ id, name, behaviorProfile, gender, seatPosition }],
//      startedAt: Date,
//      lastDecisionAt: Date | null,
//      timer: NodeJS.Timeout | null,
//      isRunning: boolean
//   }
// }
const sessionRuntime = new Map();

/**
 * הפונקציה שמחברת את ה-io לשרת הראשי
 * @param {http.Server} httpServer
 */
function initLessonSocket(httpServer) {
  console.log("function1", process.env.CLIENT_ORIGIN)
  const io = new Server(httpServer, {
    cors: {
      origin: [
      "http://localhost:3000",
      "https://pedagogical-training-project.netlify.app",
      "https://your-vercel-domain.vercel.app",
      process.env.CLIENT_ORIGIN,
    ],
    credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const sessionId = socket.handshake.query.sessionId;

    console.log("🔌 Client connected. sessionId=", sessionId);

    if (!sessionId) {
      console.warn("Client connected without sessionId – disconnecting");
      socket.disconnect();
      return;
    }

    // נשים את הסוקט בחדר לפי sessionId
    socket.join(sessionId);

    // נוודא שיש אוביקט runtime ל-session הזה
    if (!sessionRuntime.has(sessionId)) {
      sessionRuntime.set(sessionId, {
        students: [],
        startedAt: null,
        lastDecisionAt: null,
        timer: null,
        isRunning: false,
      });
    }

    const runtimeState = sessionRuntime.get(sessionId);

    /**
     * לקיחת רשימת התלמידים מהלקוח
     * { students: [{id, name, behaviorProfile, gender, position}, ...] }
     */
    socket.on("lesson:students", ({ students }) => {
      console.log(
        `👨‍👩‍👧‍👦 Received ${students?.length || 0} students for session ${sessionId}`
      );
      runtimeState.students =
        Array.isArray(students) && students.length > 0
          ? students.map((s) => ({
              id: s.id,
              name: s.name,
              behaviorProfile: s.behaviorProfile,
              gender: s.gender,
              seatPosition: s.position || null,
            }))
          : [];
    });

    /**
     * עדכון מיקום תלמיד מהלקוח
     * { id, position: [x,y,z] }
     */
    socket.on("student:moved", ({ id, position }) => {
      const st = runtimeState.students || [];
      const idx = st.findIndex((s) => s.id === id);
      if (idx !== -1) {
        st[idx].seatPosition = position;
      }
    });

    /**
     * התחלת שיעור
     * { durationSec }
     */
    socket.on("lesson:start", async ({ durationSec }) => {
      console.log(
        `▶️ Starting lesson for session ${sessionId} (duration ${durationSec}s)`
      );

      runtimeState.startedAt = new Date();
      runtimeState.isRunning = true;

      // אם יש טיימר ישן – ננקה
      if (runtimeState.timer) {
        clearTimeout(runtimeState.timer);
        runtimeState.timer = null;
      }

      // מריצים מיד סיבוב ראשון
      runDecisionCycle(io, sessionId).catch((err) => {
        console.error(
          "[lessonSocket] Error in first decision cycle:",
          err
        );
      });
    });

    /**
     * עצירת שיעור
     */
    socket.on("lesson:stop", () => {
      console.log("🛑 Lesson stopped for session", sessionId);
      runtimeState.isRunning = false;
      if (runtimeState.timer) {
        clearTimeout(runtimeState.timer);
        runtimeState.timer = null;
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected. sessionId=", sessionId);
      // אפשר לבחור למחוק מן המפה, או להשאיר – תלוי ברצונך
      // כאן נשאיר כדי לא לאבד מצב תוך כדי רענון דפדפן
    });
  });
}

/**
 * לולאת החלטה: קוראת ל-GPT ומייצרת הפרעות
 */
async function runDecisionCycle(io, sessionId) {
  const runtimeState = sessionRuntime.get(sessionId);
  if (!runtimeState || !runtimeState.isRunning) return;

  try {
    const { actions, nextCheckInSeconds } =
      await decideNextDisruptions(sessionId, runtimeState);

    runtimeState.lastDecisionAt = new Date();

    const now = Date.now();

    if (actions.length === 0) {
      console.log(
        `🤫 No disruptions this round for session ${sessionId}`
      );
    }

     for (const action of actions) {
    const ts = now + (action.delayMs || 0);

    const student =
      (runtimeState.students || []).find(
        (s) => s.id === action.studentId
      ) || null;

    // 🔹 קודם שומרים את האירוע במונגו
    let eventDoc = null;
    try {
      eventDoc = await EventModel.create({
        sessionId,                                   // 🔗 ה-Session האמיתי
        studentId: action.studentId || (student && student.id) || null,
        studentName: student?.name || "תלמיד",
        eventType: action.eventType || "disruption", // "question" | "disruption"
        content: action.utteranceText,
        timestamp: new Date(ts),                     // מתי ההפרעה "קרתה"
        status: "open",                              // עדיין לא נענתה
      });
    } catch (err) {
      console.error(
        "[lessonSocket] Failed to save Event for disruption:",
        err
      );
    }

    const payload = {
      disruptionId: `${sessionId}-${ts}`,
      studentId: action.studentId || (student && student.id) || null,
      studentName: student?.name || "תלמיד",
      type: action.behavior || "neutral",
      label: action.label || "תלמיד",
      utteranceText: action.utteranceText,
      ts,
      eventId: eventDoc ? eventDoc._id.toString() : null, // 👈 חדש
    };

    setTimeout(() => {
      console.log("📢 Emitting disruption:", payload);
      io.to(sessionId).emit("disruption", payload);
    }, action.delayMs || 0);
  }


    // קובעים סיבוב הבא
    const delayMs = (nextCheckInSeconds || 15) * 1000;

    runtimeState.timer = setTimeout(
      () => runDecisionCycle(io, sessionId),
      delayMs
    );
  } catch (err) {
    console.error(
      `[lessonSocket] Error in decision cycle for session ${sessionId}:`,
      err
    );

    // במקרה של שגיאה – ננסה שוב עוד 20 שניות
    runtimeState.timer = setTimeout(
      () => runDecisionCycle(io, sessionId),
      20000
    );
  }
}

module.exports = {
  initLessonSocket,
};