// server/src/server.js
// סימולציה עם START/STOP מהלקוח, בלי AI/Whisper.

const express = require("express");
const authRoutes = require("./routes/auth.route");
const lessonRoutes = require("./routes/lesson.routes");
const supportRoutes = require("./routes/support.route");
const behaviorRoutes = require("./routes/behavior.route");

const cors = require("cors");
const ConnectDB = require("./lib/db");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// ✅ רשימת הדומיינים שמורשים לקרוא לשרת
const allowedOrigins = [
  "http://localhost:3000",
  "https://pedagogical-training-project-client.vercel.app"
];

// ✅ CORS ל-Express API
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);
// טיפול ב־OPTIONS (Preflight)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin",
    allowedOrigins.includes(req.headers.origin) ? req.headers.origin : ""
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // מסיים את הבקשה
  }
  next();
});
// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api", lessonRoutes);
app.use("/api/supports", supportRoutes);
app.use("/api/behavior", behaviorRoutes);

// ✅ דף בדיקה
app.get("/", (req, res) => {
  res.send("✅ Server is running!");
});

// ✅ יצירת שרת HTTP + Socket.io
const server = http.createServer(app);

// ✅ Socket.io עם CORS תואם
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// ✅ Socket.io events
const {
  startBehaviorLoop,
  stopBehaviorLoop,
  setMic,
  activateLesson,
  deactivateLesson,
  upsertStudents,
  pushTeacherResponse,
  updateStudentPosition
} = require("./services/behaviorLoop");

io.on("connection", (socket) => {
  const { sessionId = socket.id } = socket.handshake.query || {};
  socket.join(sessionId);

  startBehaviorLoop({ io, room: sessionId });

  socket.on("class:init", ({ students }) => {
    if (Array.isArray(students)) upsertStudents(sessionId, students);
  });

  socket.on("lesson:start", ({ durationSec }) => {
    activateLesson(sessionId, (durationSec || 300) * 1000);
  });

  socket.on("lesson:stop", () => deactivateLesson(sessionId));

  socket.on("mic:state", (isOn) => setMic(sessionId, !!isOn));

  socket.on("student:moved", ({ id, position }) => {
    if (id && position) updateStudentPosition(sessionId, { id, position });
  });

  socket.on("teacher:response", ({ disruptionId, text, ts }) => {
    if (!disruptionId || !text) return;
    pushTeacherResponse(sessionId, { disruptionId, text, ts });
  });

  socket.on("disconnect", () => stopBehaviorLoop(sessionId));
});

// ✅ הפעלת השרת
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("✅ Server listening on", PORT);
  if (typeof ConnectDB === "function") ConnectDB();
});
