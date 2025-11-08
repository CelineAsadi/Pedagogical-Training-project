// server/src/server.js

const express = require("express");
const authRoutes = require("./routes/auth.route");
const lessonRoutes = require("./routes/lesson.routes");
const supportRoutes = require("./routes/support.route");

const cron = require("node-cron");
const axios = require("axios");

const cors = require("cors");
const ConnectDB = require("./lib/db");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ חיבור ל־MongoDB
if (typeof ConnectDB === "function") {
  ConnectDB();
}

// ✅ כדי להבטיח שהשרת יודע לעבוד עם JSON + COOKIE
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://pedagogical-training-project-client.vercel.app"
  ],
  credentials: true
}));


// ✅ Routes API
app.use("/api/auth", authRoutes);
app.use("/api", lessonRoutes);
app.use("/api/supports", supportRoutes);


// ✅ דף בדיקה
if (process.env.NODE_ENV !== "production") {
  app.get("/", (req, res) => {
    res.send("✅ Server is active & running");
  });
}


// ✅ Socket.io – גם הוא חייב לדעת מי מותר לו
const io = new Server(server, {
  cors: {
    origin:[
    "http://localhost:3000",
    //"https://pedagogical-training-project-client.vercel.app"
  ],
    credentials: true
  }
});



io.on("connection", (socket) => {
  const { sessionId = socket.id } = socket.handshake.query || {};
  socket.join(sessionId);

 
  socket.on("lesson:start", ({ durationSec }) => {
   // activateLesson(sessionId, (durationSec || 300) * 1000);
  });

 // socket.on("lesson:stop", () => deactivateLesson(sessionId));
  socket.on("mic:state", (isOn) => setMic(sessionId, !!isOn));

  socket.on("student:moved", ({ id, position }) => {
    //if (id && position) updateStudentPosition(sessionId, { id, position });
  });

  

 }); 

// ✅ Production Mode – אם הקליינט בנוי
if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../../client/build");
  app.use(express.static(clientPath));

  // ✅ במקום app.get("*") – משתמשים ב־Regex כדי למנוע את שגיאת PathError
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

// ✅ Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
});

// Cron job – שולח בקשה כל 10 דקות כדי שהשרת לא ייכבה
cron.schedule("*/10 * * * *", async () => {
  try {
    console.log(`⏳ Sending keep-alive ping to ${process.env.SERVER_URL}`);
    await axios.get(process.env.SERVER_URL);
    console.log("✅ Server kept alive successfully!");
  } catch (err) {
    console.error("❌ Keep-alive failed:", err.message);
  }
});