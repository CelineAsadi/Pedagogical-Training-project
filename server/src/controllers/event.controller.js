// server/src/controllers/event.controller.js
const EventModel = require("../models/Event");

/**
 * קביעה האם ההפרעה היא "שאלה" או "הפרעה"
 */
function inferEventType(disruption) {
  if (!disruption) return "disruption";

  const t = disruption.type || "";
  const text = disruption.utteranceText || "";

  // אם זה פרופיל "קשוב" / "נייטרלי" או שיש סימן שאלה → נחשוב שזה question
  if (
    t === "attentive" ||
    t === "neutral" ||
    (text.includes("?") && t !== "defiant")
  ) {
    return "question";
  }

  return "disruption";
}

/**
 * יצירת Event במונגו מתוך האובייקט disruption שמגיע מהקליינט
 * + חישוב זמן תגובה של המורה לאותה הפרעה.
 *
 * מחזיר:
 *  { eventDoc, responseTimeInSeconds }
 */
async function createEventFromDisruption({ sessionId, disruption }) {
  // אם אין הפרעה / אין studentId / אין טקסט – אין מה ליצור Event
  if (
    !disruption ||
    !disruption.studentId ||
    typeof disruption.utteranceText !== "string" ||
    disruption.utteranceText.trim() === ""
  ) {
    return { eventDoc: null, responseTimeInSeconds: null };
  }

  const eventType = inferEventType(disruption);
  const ts = disruption.ts ? new Date(disruption.ts) : new Date();

  // 🔁 מנגנון מניעת כפילויות:
  // עוד תשובת מורה לאותה הפרעה → משתמשים באותו Event קיים
  const existingEvent = await EventModel.findOne({
    sessionId,
    studentId: disruption.studentId,
    content: disruption.utteranceText,
    timestamp: ts,
  });

  let eventDoc = existingEvent;

  if (!eventDoc) {
    // אין Event כזה → ניצור חדש
    const eventData = {
      sessionId,
      studentId: disruption.studentId,
      studentName: disruption.studentName || "",
      eventType, // "question" | "disruption"
      content: disruption.utteranceText,
      timestamp: ts,
      status: "open",
      disruptionId: disruption.disruptionId || null, 

    };

    eventDoc = await EventModel.create(eventData);
  }

  // חישוב זמן תגובה (אם יש ts מהסוקט)
  let responseTimeInSeconds = null;
  if (disruption.ts) {
    const diffMs = Date.now() - disruption.ts;
    if (diffMs >= 0) {
      responseTimeInSeconds = Math.round(diffMs / 1000);
    }
  }

  return { eventDoc, responseTimeInSeconds };
}

module.exports = {
  createEventFromDisruption,
};