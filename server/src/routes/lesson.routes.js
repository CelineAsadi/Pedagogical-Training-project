/**
 * Lesson Routes
 * This file defines all API routes related to classroom (lesson)
 * management and retrieval.
 * All routes are protected and require user authentication.
 * The routes connect HTTP requests to lesson controller logic.
 */
const express = require("express");
const router = express.Router();
const { saveLessonSettings, getLessonSettings,getUserClasses,createBasicClass, getClassWithSummaries  } = require("../controllers/lesson.controller");
const protectRoute = require("../middleware/auth.middleware"); 

router.post("/lesson/save", protectRoute, saveLessonSettings);
router.get("/lesson/settings", protectRoute, getLessonSettings);
router.get("/lesson/all", protectRoute, getUserClasses);
router.post("/lesson/basic", protectRoute, createBasicClass);
router.get("/lesson/:classId/with-summaries", protectRoute, getClassWithSummaries);

module.exports = router;
