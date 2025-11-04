// server/src/server.js

const express = require("express");
const path = require("path");
const http = require("http");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.route");
const lessonRoutes = require("./routes/lesson.routes");
const supportRoutes = require("./routes/support.route");
const behaviorRoutes = require("./routes/behavior.route");

const ConnectDB = require("./lib/db");

dotenv.config();
const app = express();
const server = http.createServer(app);

/* ✅ Middleware */
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

/* ✅ Allow frontend URLs */
const allowedOrigins = [
  "http://localhost:3000",
  "https://pedagogical-training-project-client.vercel.app", // Vercel Client
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/* ✅ Routes */
app.use("/api/auth", authRoutes);
app.use("/api", lessonRoutes);
app.use("/api/supports", supportRoutes);
app.use("/api/behavior", behaviorRoutes);

/* ✅ Test route */
app.get("/", (req, res) => {
  res.send("✅ Server is running successfully!");
});

/* ✅ Serve Frontend (Production only) */
if (process.env.NODE_ENV === "production") {
  const __dirnamePath = path.resolve();
  const clientPath = path.join(__dirnamePath, "../client/build");

  // Serve built React app
  app.use(express.static(clientPath));

  // SPA fallback route — all non API goes to index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

/* ✅ Socket.io setup */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
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

/* ✅ Run server */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on ${PORT}`);
  ConnectDB();
});
