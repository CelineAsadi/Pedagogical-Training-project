const express = require("express");
const { generateSessionSummary } = require("../services/summaryGenerator.service");
const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId)
      return res.status(400).json({ error: "sessionId חובה" });

    const summary = await generateSessionSummary(sessionId);

    res.json({ success: true, summary });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
