const express = require("express");
const router = express.Router();
const { saveLessonSettings, getLessonSettings } = require("../controllers/lesson.controller");
const protectRoute = require("../middleware/auth.middleware"); // middleware קיים אצלך

// שמירת הגדרות כיתה
router.post("/lesson/save", protectRoute, saveLessonSettings);

// שליפת הגדרות כיתה
router.get("/lesson/settings", protectRoute, getLessonSettings);

module.exports = router;
