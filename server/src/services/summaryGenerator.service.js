// server/src/services/summaryGenerator.service.js
const Feedback = require("../models/Feedback");
const Response = require("../models/Response");
const Event = require("../models/Event");
const Summary = require("../models/Summary");
const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * בונה Summary מלא לסשן
 */
async function generateSessionSummary(sessionId) {
  // 1️⃣ לוקחים כל הפידבקים של הסשן
  const feedbacks = await Feedback.find({ sessionId }).lean();

  if (feedbacks.length === 0) {
    throw new Error("No feedbacks for summary");
  }

  // 2️⃣ מחשבים ממוצעים
  const timingAvg = avg(feedbacks.map(f => f.scoring?.timing).filter(Number));
  const toneAvg = avg(feedbacks.map(f => f.scoring?.tone).filter(Number));
  const pedagogyAvg = avg(feedbacks.map(f => f.scoring?.pedagogy).filter(Number));
  const overallAvg = avg(feedbacks.map(f => f.scoring?.overall).filter(Number));

  // 3️⃣ זמן תגובה ממוצע של המורה
  const responses = await Response.find({ sessionId }).lean();
  const avgResponseTime = avg(responses.map(r => r.responseTimeInSeconds).filter(Number));

  // 4️⃣ Events – כל ההפרעות שהיו
  const events = await Event.find({ sessionId }).lean();

  // 5️⃣ בניית Prompt ל-GPT
  const prompt = buildSummaryPrompt({
    feedbacks,
    responses,
    events,
    timingAvg,
    toneAvg,
    pedagogyAvg,
    overallAvg,
    avgResponseTime
  });

  // 6️⃣ קריאה ל-GPT
  const gptRes = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "אתה מסכם ביצוע של מורה בסימולציה פדגוגית." },
      { role: "user", content: prompt }
    ]
  });

  const analysis = JSON.parse(gptRes.choices[0].message.content);

  // 7️⃣ שמירת Summary בדאטאבייס
  const summary = await Summary.create({
    sessionId,
    overallAvg,
    timingAvg,
    toneAvg,
    pedagogyAvg,
    avgResponseTime,
    strength: analysis.strength,
    weakness: analysis.weakness
  });

  return summary;
}

function avg(arr) {
  if (!arr.length) return null;
  return Number((arr.reduce((a,b) => a+b, 0) / arr.length).toFixed(2));
}

function buildSummaryPrompt(data) {
  return `
נתוני סשן:
- ממוצע overall: ${data.overallAvg}
- ממוצע timing: ${data.timingAvg}
- ממוצע tone: ${data.toneAvg}
- ממוצע pedagogy: ${data.pedagogyAvg}
- זמן תגובה ממוצע: ${data.avgResponseTime}

פידבקים לכל תגובה:
${JSON.stringify(data.feedbacks, null, 2)}

תגובות המורה:
${JSON.stringify(data.responses, null, 2)}

הפרעות:
${JSON.stringify(data.events, null, 2)}

הוראות:
אתה צריך לספק summary כללי לסשן.
תחזיר JSON בצורה:
{
  "strength": "…",
  "weakness": "…"
}
`;
}

module.exports = { generateSessionSummary };
