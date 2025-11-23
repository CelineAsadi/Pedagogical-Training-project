// server/src/server.js

const express = require("express");
const http = require("http");
const path = require("path");

const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");
const axios = require("axios");
//const { Server } = require("socket.io");
const ttsRoutes = require("./routes/tts.route");
const ConnectDB = require("./lib/db");
const authRoutes = require("./routes/auth.route");
const lessonRoutes = require("./routes/lesson.routes");
const supportRoutes = require("./routes/support.route");
const { generateDisruptionUtterance } = require("./services/gptDisruption.service");
const feedbackRoutes = require("./routes/feedback.route");
const sessionRoutes = require("./routes/session.routes");
const { initLessonSocket } = require("./socket/lessonSocket");


dotenv.config();

/* =========================
   🔌 Express + HTTP Server
   ========================= */
const app = express();
const server = http.createServer(app);
// ✅ לחבר מנוע ההפרעות החכם (GPT) לסוקט
initLessonSocket(server);

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
      "https://pedagogical-training-project-client.vercel.app",
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
app.use("/api/tts", ttsRoutes);


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