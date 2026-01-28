/**
 * Teacher Response Routes
 * This file defines API routes related to teacher responses
 * during live teaching sessions.
 * It forwards incoming requests to the feedback controller
 * responsible for saving responses and generating AI-based feedback.
 */
const express = require("express");
const router = express.Router();
const { saveTeacherResponse } = require("../controllers/feedback.controller");

router.post("/teacher-response", saveTeacherResponse);

module.exports = router;
