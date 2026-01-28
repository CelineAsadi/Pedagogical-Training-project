/**
 * Session Summary Generation Service
 * This file implements the logic for generating a comprehensive,
 * AI-assisted pedagogical summary for a completed teaching session.
 * It aggregates quantitative feedback (timing, tone, pedagogy),
 * response metrics, and classroom events, and then uses GPT
 * to produce qualitative strengths and weaknesses in Hebrew.
 * The service is gender-aware and enforces strict linguistic rules
 * to ensure that feedback is written in direct, respectful language
 * tailored to the teacher.
 * The final output is persisted as a Summary document.
 */
const Feedback = require("../models/Feedback");
const Response = require("../models/Response");
const Event = require("../models/Event");
const Summary = require("../models/Summary");
const Session = require("../models/Session");
const User = require('../models/user.model');
const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Returns gender-specific pronouns and phrasing rules for feedback generation.
 * This helper function ensures that all GPT-generated feedback
 * is written in correct Hebrew grammatical form, based on the
 * teacher's gender.
 * It also defines forbidden words to prevent third-person references
 * and enforce direct-address feedback.
 */
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

/**
 * Generates and stores an AI-based pedagogical summary for a session.
 * This function:
 * - Loads session, user, feedback, responses, and event data
 * - Computes average performance metrics
 * - Builds a structured GPT prompt for qualitative analysis
 * - Requests strengths and weaknesses from the AI model
 * - Persists the final summary in the database
 * If no teacher responses exist, a default summary is generated.
 */
async function generateSessionSummary(sessionId) {
console.log("📌 Generating summary for session:", sessionId);
// Session → User → Gender
const session = await Session.findById(sessionId).lean();
if (!session) throw new Error("Session not found");
const user = await User.findById(session.userId).lean();
if (!user) throw new Error("User not found");
const pronouns = getPronouns(user.Gender);
const feedbacks = await Feedback.find({ sessionId }).lean();
const responses = await Response.find({ sessionId }).lean();
const events = await Event.find({ sessionId }).lean();
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