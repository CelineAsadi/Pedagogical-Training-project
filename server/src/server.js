// server/src/server.js

const express = require("express");
const http = require("http");
const path = require("path");

const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");
const axios = require("axios");
const { Server } = require("socket.io");

const ConnectDB = require("./lib/db");
const authRoutes = require("./routes/auth.route");
const lessonRoutes = require("./routes/lesson.routes");
const supportRoutes = require("./routes/support.route");
const { generateDisruptionUtterance } = require("./services/gptDisruption.service");
const feedbackRoutes = require("./routes/feedback.route");
const sessionRoutes = require("./routes/session.routes");


dotenv.config();

/* =========================
   🔌 Express + HTTP Server
   ========================= */
const app = express();
const server = http.createServer(app);

/* =========================
   🗄️ MongoDB Connection
   ========================= */
if (typeof ConnectDB === "function") {
  ConnectDB();
}

/* =========================
   ⚙️ Global Middlewares
   ========================= */
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      //"https://pedagogical-training-project-client.vercel.app",
      "https://pedagogical-training-project.onrender.com",
    ],
    credentials: true,
  })
);

/* =========================
   🚏 REST API Routes
   ========================= */
app.use("/api/auth", authRoutes);
app.use("/api", lessonRoutes);
app.use("/api/supports", supportRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/session", sessionRoutes);


/* =========================
   🧪 Health Check (Dev Only)
   ========================= */
if (process.env.NODE_ENV !== "production") {
  app.get("/", (req, res) => {
    res.send("✅ Server is active & running");
  });
}

/* =========================
   🔁 Socket.io Setup
   ========================= */
   
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
       //"https://pedagogical-training-project-client.vercel.app",
     // "https://pedagogical-training-project.onrender.com",
    ],
    credentials: true,
  },
});

/* ==================================================
   🔥 מנוע הפרעות – מצב בזיכרון לכל sessionId
   lessonState: Map<sessionId, { students: [], timer: NodeJS.Timeout | null }>
   ================================================== */
const lessonState = new Map();

/** 🛑 עצירת שיעור + ניקוי טיימר עבור session */
function stopLessonForSession(io, sessionId) {
  const state = lessonState.get(sessionId);
  if (!state) return;

  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }

  lessonState.set(sessionId, state);
  console.log(`🛑 Lesson stopped for session ${sessionId}`);
}

/** 🧠 בניית הפרעה בהתאם לפרופיל ההתנהגות של התלמיד */
function buildDisruptionForStudent(student) {
  const profile = (student.behaviorProfile || "").toLowerCase();

  let type = "neutral";
  let label = "תלמיד";

  if (profile === "attentive") {
    type = "attentive";
    label = "קשוב";
  } else if (profile === "talker") {
    type = "talker";
    label = "מדבר";
  } else if (profile === "defiant") {
    type = "defiant";
    label = "מתנגד";
  } else if (profile === "sensitive") {
    type = "sensitive";
    label = "רגיש";
  } else if (profile === "withdrawn") {
    type = "withdrawn";
    label = "מסתגר";
  } else if (profile === "conflicts") {
    type = "conflicts";
    label = "קונפליקטים";
  } else if (profile === "sarcastic") {
    type = "sarcastic";
    label = "סרקסטי";
  } else if (profile === "hyperactive") {
    type = "hyperactive";
    label = "היפראקטיבי";
  }

  return { type, label };
}


/** ▶️ הפעלת שיעור + התחלת יצירת הפרעות רנדומליות */
function startLessonForSession(io, sessionId, durationSec = 300) {
  let state = lessonState.get(sessionId) || { students: [], timer: null };

  if (state.timer) {
    clearInterval(state.timer);
  }

  console.log(`▶️ Starting lesson for session ${sessionId} (duration ${durationSec}s)`);

  const intervalMs = 3000;

  const timer = setInterval(async () => {
  const current = lessonState.get(sessionId);
  if (!current || !current.students || current.students.length === 0) {
    console.log(`⚠️ No students for session ${sessionId}, skipping disruption`);
    return;
  }

  const students = current.students;
  const randIndex = Math.floor(Math.random() * students.length);
  const student = students[randIndex];

  const d = buildDisruptionForStudent(student);

  let utteranceText;
  try {
    // 🧠 כאן GPT מייצר את כל הטקסט – אין יותר ברירת מחדל ידנית
    utteranceText = await generateDisruptionUtterance({
      student,
      lessonTopic: current.lessonTopic,
      label: d.label,
    });
  } catch (err) {
    console.error("❌ GPT disruption error, skipping this disruption:", err.message);
    return; // לא משדרים הפרעה בלי GPT
  }

  const payload = {
    disruptionId: `${sessionId}-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    type: d.type,
    label: d.label,
    utteranceText,
    ts: Date.now(),
  };

  console.log("📢 Emitting disruption:", payload);
  io.to(sessionId).emit("disruption", payload);
}, intervalMs);


  state.timer = timer;
  lessonState.set(sessionId, state);

  setTimeout(() => {
    stopLessonForSession(io, sessionId);
  }, durationSec * 1000);
}


/* =========================
   🎧 Socket.io Event Handlers
   ========================= */
io.on("connection", (socket) => {
  const { sessionId = socket.id } = socket.handshake.query || {};
  socket.join(sessionId);

  console.log(`🔌 Client connected. sessionId=${sessionId}`);

  // ✅ הקליינט שולח את רשימת התלמידים בתחילת השיעור
  socket.on("lesson:students", ({ students, lessonTopic }) => {
  const prev = lessonState.get(sessionId) || {};
  lessonState.set(sessionId, {
    ...prev,
    students: students || [],
    lessonTopic: lessonTopic || "",
  });
  console.log(
    `👨‍👩‍👧‍👦 Received ${students?.length || 0} students for session ${sessionId}, topic="${lessonTopic}"`
  );
});


  // ✅ התחלת שיעור → מפעיל מנוע ההפרעות
  socket.on("lesson:start", ({ durationSec }) => {
    startLessonForSession(io, sessionId, durationSec || 300);
  });

  // ✅ עצירת שיעור מהקליינט
  socket.on("lesson:stop", () => {
    stopLessonForSession(io, sessionId);
  });

  // ✅ ניקוי כאשר הלקוח מתנתק
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected. sessionId=${sessionId}`);
    stopLessonForSession(io, sessionId);
  });
});

/* =========================
   📦 Static Client (Production)
   ========================= */
if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../../client/build");
  app.use(express.static(clientPath));

  // משרת את ה־React app לכל ראוט שאינו /api
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

/* =========================
   🚀 Start HTTP + Socket Server
   ========================= */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`
  );
});

/* =========================
   ⏰ Keep-Alive Cron (לשרתים כמו Render/Heroku)
   ========================= */
cron.schedule("*/10 * * * *", async () => {
  try {
    console.log(`⏳ Sending keep-alive ping to ${process.env.SERVER_URL}`);
    await axios.get(process.env.SERVER_URL);
    console.log("✅ Server kept alive successfully!");
  } catch (err) {
    console.error("❌ Keep-alive failed:", err.message);
  }
});
