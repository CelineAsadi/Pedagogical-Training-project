// // server/src/routes/feedback.route.js
// const express = require("express");
// const router = express.Router();

// const Event = require("../models/Event");
// const Response = require("../models/Response");
// // const Feedback = require("../models/Feedback"); // לשימוש כשנחבר GPT

// // small helper – לזהות אם זה יותר "שאלה" או "הפרעה"
// function inferEventType(disruption) {
//   if (!disruption) return "disruption";

//   const t = disruption.type || "";
//   const text = disruption.utteranceText || "";

//   // "קשוב" / "נייטרלי" עם סימן שאלה → נתייחס כשאלה
//   if (
//     t === "attentive" ||
//     t === "neutral" ||
//     (text.includes("?") && t !== "defiant")
//   ) {
//     return "question";
//   }

//   return "disruption";
// }

// router.post("/teacher-response", async (req, res) => {
//   try {
//     const { sessionId, teacherText, voiceFeatures, disruption } = req.body;

//     if (!sessionId || !teacherText) {
//       return res.status(400).json({
//         ok: false,
//         message: "sessionId ו-teacherText הם שדות חובה",
//       });
//     }

//     // 1️⃣ אם יש disruption – ניצור/נשמור Event
//     let eventDoc = null;
//     let responseTimeInSeconds = null;

//     if (
//       disruption &&
//       disruption.studentId &&
//       typeof disruption.utteranceText === "string" &&
//       disruption.utteranceText.trim() !== ""
//     ) {
//       const eventType = inferEventType(disruption);

//       const eventData = {
//         sessionId,
//         studentId: disruption.studentId,
//         studentName: disruption.studentName || "",
//         eventType,
//         content: disruption.utteranceText,
//         timestamp: disruption.timestamp
//           ? new Date(disruption.timestamp)
//           : new Date(),
//         status: "open",
//       };

//       eventDoc = await Event.create(eventData);

//       // מחשבים זמן תגובה משוער (לא חובה)
//       if (disruption.timestamp) {
//         const diffMs = Date.now() - disruption.timestamp;
//         if (diffMs >= 0) {
//           responseTimeInSeconds = Math.round(diffMs / 1000);
//         }
//       }
//     }

//     // 2️⃣ Response – תמיד נשמור (גם אם אין הפרעה)
//     const responseData = {
//       sessionId,
//       eventId: eventDoc ? eventDoc._id : undefined,
//       studentId: disruption?.studentId || null,
//       teacherText,
//       responseTimeInSeconds,
//       voiceFeatures: {
//         volume:
//           typeof voiceFeatures?.volume === "number"
//             ? voiceFeatures.volume
//             : null,
//         pitch:
//           typeof voiceFeatures?.pitch === "number"
//             ? voiceFeatures.pitch
//             : null,
//       },
//       isGeneral: !eventDoc, // אם אין אירוע, זה דיבור כללי של המורה
//     };

//     const responseDoc = await Response.create(responseData);

//     // אם זה היה אירוע, נסמן אותו כ"answered"
//     if (eventDoc) {
//       eventDoc.status = "answered";
//       await eventDoc.save();
//     }

//     // 3️⃣ בשלב הבא – כאן אפשר לקרוא ל-GPT כדי ליצור Feedback / הפרעות נוספות
//     //   כרגע נחזיר רק מה ששמרנו.
//     return res.json({
//       ok: true,
//       sessionId,
//       savedEvent: eventDoc,
//       savedResponse: responseDoc,
//     });
//   } catch (err) {
//     console.error("❌ [teacher-response] server error:", err);
//     return res.status(500).json({
//       ok: false,
//       message: "Internal server error in teacher-response",
//     });
//   }
// });

// module.exports = router;

// server/src/routes/feedback.route.js

const express = require("express");
const router = express.Router();

const { saveTeacherResponse } = require("../controllers/feedback.controller");

// ה־route עצמו מאוד רזה – רק מפנה לפונקציית ה־controller
router.post("/teacher-response", saveTeacherResponse);

module.exports = router;

