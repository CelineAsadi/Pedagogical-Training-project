// server/src/services/gptFeedback.service.js
const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * ניתוח תגובת המורה:
 * - teacherText: מה הוא/היא אמר/ה
 * - voiceFeatures: { volume, pitch, tone }
 * - disruption: מה הייתה ההפרעה (יכול להיות null)
 *
 * מחזיר:
 * {
 *   scoring: { timing, tone, pedagogy, overall },
 *   feedbackText: "טקסט פידבק קצר בעברית"
 * }
 */
async function analyzeTeacherResponse({
  disruption,
  teacherText,
  voiceFeatures = {},
}) {
  const disruptionText = disruption?.utteranceText || "";
  const disruptionLabel = disruption?.label || "";
  const studentName = disruption?.studentName || "תלמיד/ה";
  const type = disruption?.type || "לא ידוע";

  const vol =
    typeof voiceFeatures.volume === "number" ? voiceFeatures.volume : 0;
  const pitch =
    typeof voiceFeatures.pitch === "number" ? voiceFeatures.pitch : 0;
  const toneLabel =
    typeof voiceFeatures.tone === "string" && voiceFeatures.tone.trim()
      ? voiceFeatures.tone.trim()
      : "unknown";

  const systemPrompt = `
אתה מעריך תגובות של מורים להפרעות בכיתה.

אתה מחזיר ציון בין 0 ל-10 בשלושה ממדים:
- timing (תזמון התגובה)
- tone (טון רגשי: כבוד, הכלה, אווירה בטוחה)
- pedagogy (איכות פדגוגית – איך המורה טיפל/ה במצב)
ולבסוף נותן overall (ממוצע כללי) וטקסט פידבק קצר בעברית (3–5 משפטים).

יש לך גם אינדיקציות קוליות:
- volume: עוצמת דיבור נומרית (0–1 בערך)
- pitch: גובה קול משוער ב-Hz
- tone: תווית איכותית שבאה מהניתוח הקולי בצד הלקוח, למשל:
  - "calm"     – דיבור רגוע
  - "soft"     – עדין, שקט
  - "neutral"  – רגיל
  - "firm"     – סמכותי
  - "stressed" – לחוץ/נסער
  - "loud"     – חזק מאוד
  - "angry"    – כועס/צעקה

השתמש בתווית tone ובערכי volume/pitch ככיוון בלבד, לא כאמת מוחלטת,
אבל כן תתחשב בהם:

- אם tone="angry" או "stressed" או volume גבוה מאד לאורך זמן:
  - הורד את ציון tone.
  - כתוב בפידבק שהטון נשמע נוקשה/לחוץ עבור חלק מהתלמידים.
- אם tone="calm" או "soft" והתגובה מכבדת וברורה:
  - העלה את ציון tone.
- אם הטקסט הוא משפיל, ציני, מבייש או מאיים:
  - tone נמוך גם אם volume נמוך.
- אם המורה משקף רגש, מסביר, נותן בחירה ופתרון:
  - pedagogy גבוה.
- אם המורה מתעלם לחלוטין מההפרעה או מגיב באיחור לא הגיוני:
  - timing נמוך.

היה ענייני, מקצועי, ושים דגש על למידה ושיפור, לא על שיפוטיות.
`;

  const userPrompt = `
מידע על ההקשר בכיתה:

${
  disruptionText
    ? `הייתה הפרעה לפני התגובה:
- שם תלמיד: ${studentName}
- סוג הפרעה: ${disruptionLabel || type}
- טקסט התלמיד: "${disruptionText}"`
    : `אין הפרעה ספציפית – זו תגובה כללית של המורה בשיעור.`
}

תגובת המורה (טקסט מלא):
"${teacherText}"

מאפייני קול (אינדיקציה בלבד):
- volume (0–1 בערך): ${vol.toFixed(4)}
- pitch (Hz בערך): ${pitch.toFixed(2)}
- tone label: "${toneLabel}"

החזר JSON בלבד במבנה הבא (ללא טקסט לפני/אחרי, ללא הערות):

{
  "timing": מספר בין 0 ל-10,
  "tone": מספר בין 0 ל-10,
  "pedagogy": מספר בין 0 ל-10,
  "overall": מספר בין 0 ל-10,
  "feedback": "טקסט פידבק קצר בעברית (3–5 משפטים, מותאם למורה, לא לתלמידים)"
}
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 250,
  });

  const raw = completion.choices[0].message.content?.trim() || "";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("❌ Failed to parse GPT feedback JSON, raw:", raw);
    // fallback בסיסי – שלא נקרוס
    parsed = {
      timing: 5,
      tone: 5,
      pedagogy: 5,
      overall: 5,
      feedback: "לא ניתן היה לנתח את התגובה, נסה שוב מאוחר יותר.",
    };
  }

  return {
    scoring: {
      timing: parsed.timing,
      tone: parsed.tone,
      pedagogy: parsed.pedagogy,
      overall: parsed.overall,
    },
    feedbackText: parsed.feedback,
  };
}

module.exports = { analyzeTeacherResponse };
