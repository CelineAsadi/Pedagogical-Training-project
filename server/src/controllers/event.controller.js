/**
 * Event Utilities
 * ---------------
 * This file is responsible for translating student disruptions or utterances
 * into persistent Event records in the database.
 *
 * It infers the event type (question vs disruption), prevents duplicate events,
 * stores relevant metadata, and optionally calculates teacher response time.
 *
 * Used mainly in live classroom/session simulations.
 */
const EventModel = require("../models/Event");

/**
 * Infers the event type based on disruption metadata.
 * Determines whether a student utterance should be classified as a
 * "question" or a "disruption".
 */
function inferEventType(disruption) {
  if (!disruption) return "disruption";
  const t = disruption.type || "";
  const text = disruption.utteranceText || "";
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
 * Creates (or retrieves) an Event document from a disruption object.
 * This function:
 * - Validates disruption data
 * - Infers the event type
 * - Prevents duplicate events
 * - Persists the event in the database
 * - Calculates response time (if timestamp exists)
 */
async function createEventFromDisruption({ sessionId, disruption }) {
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
  const existingEvent = await EventModel.findOne({
    sessionId,
    studentId: disruption.studentId,
    content: disruption.utteranceText,
    timestamp: ts,
  });
  let eventDoc = existingEvent;
  if (!eventDoc) {
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