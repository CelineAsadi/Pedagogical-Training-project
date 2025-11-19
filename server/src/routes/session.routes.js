// server/src/routes/session.routes.js

const express = require("express");
const router = express.Router();

const { startSession } = require("../controllers/session.controller");

// כרגע בלי auth.middleware כדי לא להפיל את השרת
router.post("/start", startSession);

module.exports = router;
