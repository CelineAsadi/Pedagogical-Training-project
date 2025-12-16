// // server/src/services/summaryGenerator.service.js
// const Feedback = require("../models/Feedback");
// const Response = require("../models/Response");
// const Event = require("../models/Event");
// const Summary = require("../models/Summary");
// const OpenAI = require("openai");

// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// /** Build Summary for one session */
// async function generateSessionSummary(sessionId) {
//   console.log("📌 [SUMMARY] Starting summary generation for session:", sessionId);

//   // 1️⃣ Get all feedbacks
//   const feedbacks = await Feedback.find({ sessionId }).lean();
//   console.log("📌 [SUMMARY] Loaded feedback documents:", feedbacks.length);

//   if (feedbacks.length === 0) {
//     console.log("❌ [SUMMARY] No feedbacks found → stopping");
//     throw new Error("No feedbacks for summary");
//   }

//   // 2️⃣ Averages
//   const timingAvg = avg(feedbacks.map(f => f.scoring?.timing).filter(Number));
//   const toneAvg = avg(feedbacks.map(f => f.scoring?.tone).filter(Number));
//   const pedagogyAvg = avg(feedbacks.map(f => f.scoring?.pedagogy).filter(Number));
//   const overallAvg = avg(feedbacks.map(f => f.scoring?.overall).filter(Number));

//   // 3️⃣ Avg response time
//   const responses = await Response.find({ sessionId }).lean();
//   const avgResponseTime = avg(responses.map(r => r.responseTimeInSeconds).filter(Number));

//   // 4️⃣ Events
//   const events = await Event.find({ sessionId }).lean();

//   // 5️⃣ Build prompt
//   const prompt = buildSummaryPrompt({
//     feedbacks,
//     responses,
//     events,
//     timingAvg,
//     toneAvg,
//     pedagogyAvg,
//     overallAvg,
//     avgResponseTime
//   });

//   console.log("📌 [SUMMARY] GPT Prompt sent:\n", prompt);

//   // 6️⃣ GPT CALL
//   const gptRes = await client.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       { role: "system", content: "You summarize a teacher's performance in a pedagogical simulation. This means you summarize all the feedback from that simulation." },
//       { role: "user", content: prompt }
//     ]
//   });

//   console.log("📌 [SUMMARY] GPT Raw Response:\n", gptRes.choices[0].message.content);

// let raw = gptRes.choices[0].message.content || "";

// // 🧹 Remove markdown code fences
// raw = raw.replace(/```json/gi, "")
//          .replace(/```/g, "")
//          .trim();

// console.log("📌 [SUMMARY] Cleaned GPT Response:", raw);

// let analysis;
// try {
//   analysis = JSON.parse(raw);
// } catch (e) {
//   console.error("❌ Failed to parse GPT response:", e, "\nRaw:", raw);
//   throw new Error("GPT summary JSON malformed");
// }

//   // 7️⃣ SAVE SUMMARY
//   const summary = await Summary.create({
//     sessionId,
//     overallAvg,
//     timingAvg,
//     toneAvg,
//     pedagogyAvg,
//     avgResponseTime,
//     strength: analysis.strength,
//     weakness: analysis.weakness
//   });

//   console.log("✅ [SUMMARY] Final saved summary:\n", summary);

//   return summary;
// }

// function avg(arr) {
//   if (!arr.length) return null;
//   return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
// }

// function buildSummaryPrompt(data) {
//   return `
//  Session data:
// - overall average: ${data.overallAvg}
// - timing average: ${data.timingAvg}
// - tone average: ${data.toneAvg}
// - pedagogy average: ${data.pedagogyAvg}
// - response time average: ${data.avgResponseTime}

// Feedback:
// ${JSON.stringify(data.feedbacks, null, 2)}

// Teacher responses:
// ${JSON.stringify(data.responses, null, 2)}

// Interruptions:
// ${JSON.stringify(data.events, null, 2)}

// Instructions:
// Return JSON:
// {
// "strength": "…",
// "weakness": "…"
// `;
// }

// module.exports = { generateSessionSummary };

// server/src/services/summaryGenerator.service.js


/** Build Summary for one session */
// async function generateSessionSummary(sessionId) {
//   console.log("📌 [SUMMARY] Starting summary generation for session:", sessionId);

//   // 1️⃣ Get all feedbacks
//   const feedbacks = await Feedback.find({ sessionId }).lean();
//   console.log("📌 [SUMMARY] Loaded feedback documents:", feedbacks.length);

//   if (feedbacks.length === 0) {
//     console.log("❌ [SUMMARY] No feedbacks found → stopping");
//     throw new Error("No feedbacks for summary");
//   }

//   // 2️⃣ Averages
//   const timingAvg = avg(feedbacks.map(f => f.scoring?.timing).filter(Number));
//   const toneAvg = avg(feedbacks.map(f => f.scoring?.tone).filter(Number));
//   const pedagogyAvg = avg(feedbacks.map(f => f.scoring?.pedagogy).filter(Number));
//   const overallAvg = avg(feedbacks.map(f => f.scoring?.overall).filter(Number));

//   // 3️⃣ Avg response time
//   const responses = await Response.find({ sessionId }).lean();
//   const avgResponseTime = avg(responses.map(r => r.responseTimeInSeconds).filter(Number));

//   // 4️⃣ Events
//   const events = await Event.find({ sessionId }).lean();

//   // 5️⃣ Build prompt — NOW IN HEBREW
//   const prompt = buildSummaryPrompt({
//     feedbacks,
//     responses,
//     events,
//     timingAvg,
//     toneAvg,
//     pedagogyAvg,
//     overallAvg,
//     avgResponseTime
//   });

//   console.log("📌 [SUMMARY] GPT Prompt sent:\n", prompt);

//   // 6️⃣ GPT CALL — *instructions now in Hebrew*
//   const gptRes = await client.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       {
//         role: "system",
//         content:
//           "אתה מנתח ביצועי מורה בסימולציה פדגוגית. עליך לסכם בצורה מקצועית וברורה את כלל המשובים, האירועים והתגובות. הסיכום צריך להיות בעברית ברורה ועניינית."
//       },
//       { role: "user", content: prompt }
//     ]
//   });

//   console.log("📌 [SUMMARY] GPT Raw Response:\n", gptRes.choices[0].message.content);

//   let raw = gptRes.choices[0].message.content || "";

//   // 🧹 Remove ```json … ```
//   raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

//   console.log("📌 [SUMMARY] Cleaned GPT Response:", raw);

//   let analysis;
//   try {
//     analysis = JSON.parse(raw);
//   } catch (e) {
//     console.error("❌ Failed to parse GPT response:", e, "\nRaw:", raw);
//     throw new Error("GPT summary JSON malformed");
//   }

//   // 7️⃣ SAVE SUMMARY
//   const summary = await Summary.create({
//     sessionId,
//     overallAvg,
//     timingAvg,
//     toneAvg,
//     pedagogyAvg,
//     avgResponseTime,
//     strength: analysis.strength,
//     weakness: analysis.weakness
//   });

//   console.log("✅ [SUMMARY] Final saved summary:\n", summary);

//   return summary;
// }
// const Feedback = require("../models/Feedback");
// const Response = require("../models/Response");
// const Event = require("../models/Event");
// const Summary = require("../models/Summary");
// const OpenAI = require("openai");

// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// /** Build Summary for one session */
// async function generateSessionSummary(sessionId) {
//   console.log("📌 [SUMMARY] Starting summary generation for session:", sessionId);

//   const feedbacks = await Feedback.find({ sessionId }).lean();
//   const responses = await Response.find({ sessionId }).lean(); // 👈 חשוב
//   const events = await Event.find({ sessionId }).lean();

//   // 🟦 1) אם אין תגובות מורה — מחזירים סיכום עם אפסים וחולשה בלבד
//   if (responses.length === 0) {
//     console.log("⚠️ No teacher responses found → generating zero-summary");

//     const summary = await Summary.create({
//       sessionId,
//       overallAvg: 0,
//       timingAvg: 0,
//       toneAvg: 0,
//       pedagogyAvg: 0,
//       avgResponseTime: 0,
//       strength: "",   // אין חוזקות
//       weakness: "לא נמסרו תגובות מורה במהלך השיעור ולכן לא ניתן להעריך ביצועים."
//     });

//     return summary;
//   }

//   // 🟦 2) המשך רגיל — יש תגובות ולכן מחשבים ממוצעים
//   const timingAvg = avg(feedbacks.map(f => f.scoring?.timing).filter(Number));
//   const toneAvg = avg(feedbacks.map(f => f.scoring?.tone).filter(Number));
//   const pedagogyAvg = avg(feedbacks.map(f => f.scoring?.pedagogy).filter(Number));
//   const overallAvg = avg(feedbacks.map(f => f.scoring?.overall).filter(Number));
//   const avgResponseTime = avg(responses.map(r => r.responseTimeInSeconds).filter(Number));

//   // 🔥 יצירת prompt ובקשה ל-GPT כמו שהיה קודם
//   const prompt = buildSummaryPrompt({
//     feedbacks,
//     responses,
//     events,
//     timingAvg,
//     toneAvg,
//     pedagogyAvg,
//     overallAvg,
//     avgResponseTime
//   });

//   const gptRes = await client.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       {
//         role: "system",
//         content:
//           "אתה מנתח ביצועי מורה בסימולציה פדגוגית. עליך לסכם בצורה מקצועית וברורה את כלל המשובים."
//       },
//       { role: "user", content: prompt }
//     ]
//   });

//   let raw = gptRes.choices[0].message.content || "";
//   raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

//   const analysis = JSON.parse(raw);

//   const summary = await Summary.create({
//     sessionId,
//     overallAvg,
//     timingAvg,
//     toneAvg,
//     pedagogyAvg,
//     avgResponseTime,
//     strength: analysis.strength,
//     weakness: analysis.weakness
//   });

//   return summary;
// }


// function avg(arr) {
//   if (!arr.length) return null;
//   return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
// }

// /** PROMPT IN HEBREW */
// function buildSummaryPrompt(data) {
//   return `
// נתוני השיעור:
// - ציון כללי ממוצע: ${data.overallAvg}
// - תזמון ממוצע: ${data.timingAvg}
// - טון דיבור ממוצע: ${data.toneAvg}
// - פדגוגיה ממוצעת: ${data.pedagogyAvg}
// - זמן תגובה ממוצע: ${data.avgResponseTime}

// משובים:
// ${JSON.stringify(data.feedbacks, null, 2)}

// תגובות המורה:
// ${JSON.stringify(data.responses, null, 2)}

// אירועי הפרעות:
// ${JSON.stringify(data.events, null, 2)}

// הוראות:
// נא ליצור סיכום מקצועי בעברית הכולל:
// 1. "strength" — פסקה קצרה המתארת את החוזקות של המורה.
// 2. "weakness" — פסקה קצרה המתארת את נקודות החולשה והדברים לשיפור.
// 3.  ⚠️ סגנון ניסוח מחייב:
// - כל הפידבק חייב להיות מנוסח בלשון פנייה ישירה למשתמשת ("את", "שלך").
// - אסור להשתמש בלשון גוף שלישי.
// - אסור להשתמש במילים: "המורה", "היא", "המרצה", "המדריכה".
// - כל משפט חייב להתחיל בפנייה ישירה (לדוגמה: "את מצליחה...", "כדאי שתשימי לב...").

// 4.ואל תכתוב את החולשות החוזקות בשפת AI אלא בשפה קלה ומונגשת
 
// 5. לפני החזרת התשובה:
// בדוק שכל המשפטים מנוסחים בלשון "את".
// אם קיים משפט אחד שאינו עומד בכך – נסח אותו מחדש.



// החזר אך ורק JSON בפורמט:
// {
// "strength": "טקסט בעברית…",
// "weakness": "טקסט בעברית…"
// }
// `.trim();
// }

// module.exports = { generateSessionSummary };
const Feedback = require("../models/Feedback");
const Response = require("../models/Response");
const Event = require("../models/Event");
const Summary = require("../models/Summary");
const Session = require("../models/Session");
const User = require('../models/user.model');
const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ===============================
Pronoun rules
================================ */
function getPronouns(Gender) {
if (Gender === "Male") {
return {
you: "אתה",
exampleGood: "אתה מצליח...",
exampleImprove: "כדאי שתשים לב...",
forbidden: ["המורה", "הוא", "המרצה", "המדריך"],
};
}

// default: female
return {
you: "את",
exampleGood: "את מצליחה...",
exampleImprove: "כדאי שתשימי לב...",
forbidden: ["המורה", "היא", "המרצה", "המדריכה"],
};
}

/* ===============================
Main function
================================ */
async function generateSessionSummary(sessionId) {
console.log("📌 Generating summary for session:", sessionId);

// 🔹 Session → User → Gender
const session = await Session.findById(sessionId).lean();
if (!session) throw new Error("Session not found");

const user = await User.findById(session.userId).lean();
if (!user) throw new Error("User not found");

const pronouns = getPronouns(user.Gender);

const feedbacks = await Feedback.find({ sessionId }).lean();
const responses = await Response.find({ sessionId }).lean();
const events = await Event.find({ sessionId }).lean();

// אין תגובות מורה
if (responses.length === 0) {
return Summary.create({
sessionId,
overallAvg: 0,
timingAvg: 0,
toneAvg: 0,
pedagogyAvg: 0,
avgResponseTime: 0,
strength: "",
weakness:
pronouns.you +
" לא סיפקת תגובות במהלך השיעור ולכן לא ניתן להעריך את הביצועים שלך.",
});
}

const avg = (arr) =>
arr.length
? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2))
: 0;

const timingAvg = avg(feedbacks.map(f => f.scoring?.timing).filter(Number));
const toneAvg = avg(feedbacks.map(f => f.scoring?.tone).filter(Number));
const pedagogyAvg = avg(feedbacks.map(f => f.scoring?.pedagogy).filter(Number));
const overallAvg = avg(feedbacks.map(f => f.scoring?.overall).filter(Number));
const avgResponseTime = avg(responses.map(r => r.responseTimeInSeconds).filter(Number));

const prompt = buildSummaryPrompt({
feedbacks,
responses,
events,
timingAvg,
toneAvg,
pedagogyAvg,
overallAvg,
avgResponseTime,
pronouns,
});

const gptRes = await client.chat.completions.create({
model: "gpt-4o-mini",
messages: [
{
role: "system",
content: "אתה מחולל משוב פדגוגי בעברית בלבד.",
},
{ role: "user", content: prompt },
],
});

let raw = gptRes.choices[0].message.content || "";
raw = raw.replace(/```json|```/gi, "").trim();

let analysis;
try {
analysis = JSON.parse(raw);
} catch {
console.error("❌ GPT returned invalid JSON:\n", raw);
throw new Error("Invalid GPT JSON");
}

return Summary.create({
sessionId,
overallAvg,
timingAvg,
toneAvg,
pedagogyAvg,
avgResponseTime,
strength: analysis.strength,
weakness: analysis.weakness,
});
}

/* ===============================
Prompt builder
================================ */
function buildSummaryPrompt(data) {
const p = data.pronouns;

   return `
// נתוני השיעור:
// - ציון כללי ממוצע: ${data.overallAvg}
// - תזמון ממוצע: ${data.timingAvg}
// - טון דיבור ממוצע: ${data.toneAvg}
// - פדגוגיה ממוצעת: ${data.pedagogyAvg}
// - זמן תגובה ממוצע: ${data.avgResponseTime}

// משובים:
// ${JSON.stringify(data.feedbacks, null, 2)}

// תגובות המורה:
// ${JSON.stringify(data.responses, null, 2)}

// אירועי הפרעות:
// ${JSON.stringify(data.events, null, 2)}

// הוראות:
// נא ליצור סיכום מקצועי בעברית הכולל:
// 1. "strength" — פסקה קצרה המתארת את החוזקות של המורה.
// 2. "weakness" — פסקה קצרה המתארת את נקודות החולשה והדברים לשיפור.
הוראות ניסוח:
- כתוב בלשון פנייה ישירה בלבד: "${p.you}"
- אל תשתמש בגוף שלישי
- אסור להשתמש במילים: ${p.forbidden.join(", ")}
- כל משפט חייב להתחיל בפנייה ישירה
- דוגמה: "${p.exampleGood}", "${p.exampleImprove}"
- שפה פשוטה, לא טכנית
- עברית בלבד
// ואל תכתוב את החולשות החוזקות בשפת AI אלא בשפה קלה ומונגשת
 
//  לפני החזרת התשובה:
// בדוק שכל המשפטים מנוסחים בלשון "את".
// אם קיים משפט אחד שאינו עומד בכך – נסח אותו מחדש.


החזר אך ורק JSON:
{
"strength": "…",
"weakness": "…"
}
`.trim();
}

module.exports = { generateSessionSummary };