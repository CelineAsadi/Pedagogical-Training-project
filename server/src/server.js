// server/src/server.js
// סימולציה עם START/STOP מהלקוח, בלי AI/Whisper.

const express = require("express");
const authRoutes = require("./routes/auth.route");
const supportRoutes = require("./routes/support.route");
const cors = require("cors");
const ConnectDB = require("./lib/db");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const http = require("http");

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/api/auth", authRoutes);
app.use("/api/supports", supportRoutes);
const behaviorRoutes = require("./routes/behavior.route");
app.use("/api/behavior", behaviorRoutes);

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });

const {
  startBehaviorLoop,
  stopBehaviorLoop,
  setMic,
  activateLesson,
  deactivateLesson,
  upsertStudents,
  pushTeacherResponse,
  updateStudentPosition,
} = require("./services/behaviorLoop");

io.on("connection", (socket) => {
  const { sessionId = socket.id } = socket.handshake.query || {};
  socket.join(sessionId);

  // מפעילים את הטיימר הפנימי של הסשן, אבל השיעור לא פעיל עד START
  startBehaviorLoop({ io, room: sessionId });

  // איניט כיתה
  socket.on("class:init", ({ students }) => {
    if (Array.isArray(students)) upsertStudents(sessionId, students);
  });

  // שליטה בשיעור
  socket.on("lesson:start", ({ durationSec }) => {
    activateLesson(sessionId, (durationSec || 300) * 1000);
  });
  socket.on("lesson:stop", () => {
    deactivateLesson(sessionId);
  });

  // מיקרופון מורה (לא חובה, אך מונע הפרעות כשהמורה מדבר אם תשתמשי בעתיד)
  socket.on("mic:state", (isOn) => setMic(sessionId, !!isOn));

  // תזוזות תלמידים
  socket.on("student:moved", ({ id, position }) => {
    if (id && position) updateStudentPosition(sessionId, { id, position });
  });

  // תגובת מורה (טקסט שמגיע מהתמלול בצד הלקוח)
  socket.on("teacher:response", ({ disruptionId, text, ts }) => {
    if (!disruptionId || !text) return;
    pushTeacherResponse(sessionId, { disruptionId, text, ts });
  });

  // "הקלטה" — לוגים בלבד
  socket.on("rec:start", ({ durationSec }) => {
    console.log(`SIM RECORD START | session=${sessionId} | duration=${durationSec || 300}s`);
  });
  socket.on("rec:stop", () => {
    console.log(`SIM RECORD STOP  | session=${sessionId}`);
  });

  socket.on("disconnect", () => {
    stopBehaviorLoop(sessionId);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("Server listening on", PORT, "| SIMULATION MODE (Start via lesson:start)");
  if (typeof ConnectDB === "function") ConnectDB();
});
