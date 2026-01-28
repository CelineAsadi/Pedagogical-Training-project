/**
 * Session Routes
 * This file defines API routes related to teaching session lifecycle
 * and session history retrieval.
 * The routes connect HTTP requests to session controller logic
 * and apply authentication middleware where required.
 */
const express = require("express");
const router = express.Router();
const protectRoute = require('../middleware/auth.middleware');
const { startSession,getLastThreeSessions } = require("../controllers/session.controller");

router.post("/start", startSession);
router.get("/last-three/:sessionId", protectRoute, getLastThreeSessions);

module.exports = router;
