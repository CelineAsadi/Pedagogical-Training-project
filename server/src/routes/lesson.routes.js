const express = require("express");
const router = express.Router();
const { saveLessonSettings, getLessonSettings,getUserClasses } = require("../controllers/lesson.controller");
const protectRoute = require("../middleware/auth.middleware"); // middleware קיים אצלך

// שמירת הגדרות כיתה
router.post("/lesson/save", protectRoute, saveLessonSettings);

// שליפת הגדרות כיתה
router.get("/lesson/settings", protectRoute, getLessonSettings);
// שליפת כל הכיתות של המשתמש
router.get("/lesson/all", protectRoute, getUserClasses);
router.post("/lesson/basic", protectRoute, createBasicClass);

module.exports = router;
