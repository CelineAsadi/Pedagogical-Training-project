/**
 * Session Summary Route
 * This file exposes an endpoint for generating an AI-based summary
 * of a teaching session.
 * The route acts as a thin orchestration layer that:
 * - Validates the incoming request
 * - Triggers the session summary generation service
 * - Returns aggregated pedagogical metrics and insights
 * The actual summary logic is handled in the service layer
 * (summaryGenerator.service), keeping this file lightweight
 * and focused on request handling.
 */
const express = require("express");
const { generateSessionSummary } = require("../services/summaryGenerator.service");
const router = express.Router();
/**
 * Generates an AI-based summary for a teaching session.
 * This handler:
 * - Validates that a sessionId is provided
 * - Delegates summary generation to the summary service
 * - Returns aggregated pedagogical metrics and insights
 */
router.post("/generate", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId)
      return res.status(400).json({ error: " must sessionId " });
    const summary = await generateSessionSummary(sessionId);
    res.json({ success: true, summary });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
