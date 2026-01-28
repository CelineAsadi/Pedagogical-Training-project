/**
 * Lesson Socket Engine
 * This file implements the real-time classroom simulation engine using Socket.IO.
 * It manages live lesson sessions, maintains runtime state per session,
 * and periodically invokes the AI disruption decision engine to generate
 * realistic student behaviors during the lesson.
 * The socket layer is responsible for:
 * - Managing client connections per session
 * - Tracking students and seating positions
 * - Starting and stopping lessons
 * - Emitting AI-generated disruptions in real time
 * This module coordinates between real-time events, persistence,
 * and AI-driven classroom logic.
 */
const { Server } = require("socket.io");
const { decideNextDisruptions } = require("../logic/gptClassEngine");
const EventModel = require("../models/Event");
const Session = require("../models/Session");
const sessionRuntime = new Map();

/**
 * Initializes the Socket.IO server for lesson sessions.
 * This function:
 * - Attaches a Socket.IO server to the given HTTP server
 * - Manages client connections scoped by sessionId
 * - Initializes and maintains in-memory runtime state per session
 * - Listens for lesson lifecycle events (start, stop)
 * - Receives student data and real-time updates (movement, seating)
 * Each connected client is joined to a room identified by sessionId,
 * allowing disruptions and events to be broadcast only to the relevant classroom.
 */
function initLessonSocket(httpServer) {
  console.log("function1", process.env.CLIENT_ORIGIN)
  const io = new Server(httpServer, {
    cors: {
      origin: [
      "http://localhost:3000",
      "https://pedagogical-training-project.netlify.app",
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
  socket.join(sessionId);
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
    socket.on("student:moved", ({ id, position }) => {
      const st = runtimeState.students || [];
      const idx = st.findIndex((s) => s.id === id);
      if (idx !== -1) {
        st[idx].seatPosition = position;
      }
    });
    socket.on("lesson:start", async ({ durationSec }) => {
      console.log(
        `▶️ Starting lesson for session ${sessionId} (duration ${durationSec}s)`
      );
      runtimeState.startedAt = new Date();
      runtimeState.isRunning = true;
      if (runtimeState.timer) {
        clearTimeout(runtimeState.timer);
        runtimeState.timer = null;
      }
      runDecisionCycle(io, sessionId).catch((err) => {
        console.error(
          "[lessonSocket] Error in first decision cycle:",
          err
        );
      });
    });
  socket.on("lesson:stop", async () => {
  console.log("🛑 Lesson stopped for session", sessionId);
  runtimeState.isRunning = false;
  if (runtimeState.timer) {
    clearTimeout(runtimeState.timer);
    runtimeState.timer = null;
  }
  try {
    await Session.findByIdAndUpdate(sessionId, {
      endTime: new Date(),
      status: "completed",
    });
    console.log("✅ Session endTime updated:", sessionId);
  } catch (err) {
    console.error("❌ Failed to update endTime:", err);
  }
});
    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected. sessionId=", sessionId);
    });
  });
}
/**
 * Runs a single AI-driven disruption decision cycle for a session.
 * This function:
 * - Builds the current classroom context from runtime state
 * - Calls the GPT-based disruption engine
 * - Persists generated disruption events to the database
 * - Emits disruption events to connected clients with proper timing
 * - Schedules the next decision cycle based on AI recommendations
 * The cycle continues automatically while the lesson is running
 * and stops gracefully when the session ends.
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
    let eventDoc = null;
    try {
      eventDoc = await EventModel.create({
        sessionId,                                 
        studentId: action.studentId || (student && student.id) || null,
        studentName: student?.name || "תלמיד",
        eventType: action.eventType || "disruption", // "question" | "disruption"
        content: action.utteranceText,
        timestamp: new Date(ts),                 
        status: "open",                            
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
      eventId: eventDoc ? eventDoc._id.toString() : null, 
    };
    setTimeout(() => {
      console.log("📢 Emitting disruption:", payload);
      io.to(sessionId).emit("disruption", payload);
    }, action.delayMs || 0);
  }
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
    runtimeState.timer = setTimeout(
      () => runDecisionCycle(io, sessionId),
      20000
    );
  }
}

module.exports = {
  initLessonSocket,
};