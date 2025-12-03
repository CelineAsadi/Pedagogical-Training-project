// server/src/routes/session.routes.js

const express = require("express");
const router = express.Router();
const protectRoute = require('../middleware/auth.middleware');

const { startSession,getLastThreeSessions } = require("../controllers/session.controller");

// כרגע בלי auth.middleware כדי לא להפיל את השרת
router.post("/start", startSession);
router.get("/last-three/:sessionId", protectRoute, getLastThreeSessions);

module.exports = router;
