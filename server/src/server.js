// server/src/server.js
// סימולציה עם START/STOP מהלקוח, בלי AI/Whisper.

const express = require("express");
const authRoutes = require("./routes/auth.route");
const lessonRoutes = require("./routes/lesson.routes");

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
const allowedOrigins = [
  "http://localhost:3000", // פיתוח מקומי
  "https://pedagogical-training-project-client-qttkxx7yz.vercel.app" // הקישור של ה-Client אחרי Deploy
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api", lessonRoutes);

app.use("/api/supports", supportRoutes);
const behaviorRoutes = require("./routes/behavior.route");
app.use("/api/behavior", behaviorRoutes);

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });
app.get("/", (req, res) => {
  res.send("✅ Server is running!");
});

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

  startBehaviorLoop({ io, room: sessionId });

  socket.on("class:init", ({ students }) => {
    if (Array.isArray(students)) upsertStudents(sessionId, students);
  });

  socket.on("lesson:start", ({ durationSec }) => {
    activateLesson(sessionId, (durationSec || 300) * 1000);
  });
  socket.on("lesson:stop", () => {
    deactivateLesson(sessionId);
  });

  socket.on("mic:state", (isOn) => setMic(sessionId, !!isOn));

  socket.on("student:moved", ({ id, position }) => {
    if (id && position) updateStudentPosition(sessionId, { id, position });
  });

  socket.on("teacher:response", ({ disruptionId, text, ts }) => {
    if (!disruptionId || !text) return;
    pushTeacherResponse(sessionId, { disruptionId, text, ts });
  });

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
