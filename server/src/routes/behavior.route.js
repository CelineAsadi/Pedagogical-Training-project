// server/src/routes/behavior.route.js
const router = require('express').Router();
const { ensureSession, upsertStudents, pushTeacherUtterance } = require('../services/behaviorLoop');

router.post('/init', (req, res) => {
  const { sessionId, teacherProfile, students } = req.body || {};
  if (!sessionId) return res.status(400).json({ message: 'sessionId required' });
  const st = ensureSession(sessionId);
  if (teacherProfile) st.teacherProfile = teacherProfile;
  if (Array.isArray(students)) upsertStudents(sessionId, students);
  return res.json({ ok: true });
});

router.post('/teacher-utterance', (req, res) => {
  const { sessionId, text } = req.body || {};
  if (!sessionId || !text) return res.status(400).json({ message: 'sessionId & text required' });
  pushTeacherUtterance(sessionId, text);
  return res.json({ ok: true });
});

module.exports = router;
