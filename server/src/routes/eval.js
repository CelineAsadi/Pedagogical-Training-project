const express = require('express');
const multer = require('multer');
const upload = multer();
const router = express.Router();
const { loops } = require('../services/behaviorLoop');

// STT דמה: מקבל אודיו ומחזיר טקסט/טון/תזמון
router.post('/stt', upload.single('audio'), async (req, res) => {
  res.json({
    text: 'אני מבקש לשמור על שקט ולהתרכז. נמשיך יחד.',
    tone: 'calm',
    timingMs: 1500
  });
});

// ציון דמה (בהמשך: חיבור ל-OpenAI עם הרוביק שלך)
router.post('/score', express.json(), async (req, res) => {
  const { sessionId, text, tone, timingMs } = req.body;
  const score = 78;
  const feedback = {
    strengths: ['טון רגוע', 'מסר ברור'],
    improve: ['להציע בחירה/חלופה לתלמיד'],
    explanation: 'תגובה רגועה עם גבול ברור, אפשר לחזק אוטונומיה.'
  };
  const st = loops.get(sessionId);
  if (st) {
    st.lastScore = score;
    st.lastTone = tone || st.lastTone;
    st.lastTeacherResponse = { text, tone, timingMs };
  }
  res.json({ score, feedback });
});

module.exports = router;
