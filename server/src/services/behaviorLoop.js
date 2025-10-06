// server/src/services/behaviorLoop.js
// סימולציה בלבד: מייצר הפרעות. תומך ב"הפעלה" באמצעות lesson:start ובכמה הפרעות במקביל.

const { randomUUID } = require('crypto');

const sessions = new Map();

function ensureSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      room: sessionId,
      active: false,             // ← יתחיל רק אחרי "lesson:start"
      startedAt: null,
      endsAt: null,
      nextAt: Date.now() + 60_000, // ברירת מחדל עד שילחצו START
      micOn: false,

      teacherProfile: { id: 't1', name: 'Teacher', toleranceLevel: 0.6, style: 'assertive-kind' },
      students: [],      // [{ id, name, behaviorProfile, cooldownUntil, position:[x,y,z] }]
      history: [],       // [{ type:'disruption'|'teacher', ts, text, studentId?, severity?, disruptionId?, replyTo? }]

      timer: null,
    });
  }
  return sessions.get(sessionId);
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function pickStudent(state, now, excludeIds = []) {
  const arr = state.students;
  if (!arr?.length) return null;

  const weights = arr.map(st => {
    if (excludeIds.includes(st.id)) return { st, w: 0 };
    let w = 1.0;
    if (st.behaviorProfile === 'talker')      w += 1.2;
    if (st.behaviorProfile === 'defiant')     w += 1.0;
    if (st.behaviorProfile === 'hyperactive') w += 0.8;

    if (now < (st.cooldownUntil || 0)) w = 0;

    const recent = state.history.slice(-6).some(ev => ev.studentId === st.id && ev.type === 'disruption');
    if (recent) w *= 0.4;

    return { st, w };
  });

  const sum = weights.reduce((a,b)=>a+b.w,0);
  if (sum <= 0) return null;

  let r = Math.random()*sum;
  for (const {st,w} of weights) { r -= w; if (r<=0) return st; }
  return arr[0];
}

function makeFakeUtterance(profile) {
  const m = {
    talker:      ['המורה, לא שמעתי… מה אמרת?', 'רגע, מה עושים עכשיו?'],
    defiant:     ['למה חייבים? זה לא הוגן.', 'אני לא עושה את זה.'],
    conflicts:   ['הוא התחיל! זה לא אני!', 'הוא מציק לי!'],
    hyperactive: ['תראו תראו! חחח…', 'אפשר לצאת רגע?'],
    sarcastic:   ['וואו, מרתק…', 'זה באמת חשוב?'],
    sensitive:   ['לא הבנתי, אפשר שוב?', 'אפשר דוגמה נוספת?'],
    attention:   ['סיימתי כבר. מה עכשיו?', 'אפשר עוד מטלה?'],
    withdrawn:   ['…', '(שותק/ת)'],
    neutral:     ['המורה?', 'יש לי שאלה.'],
  };
  const arr = m[profile] || m.neutral;
  return arr[Math.floor(Math.random() * arr.length)];
}
function severityByProfile(profile) {
  if (profile === 'defiant') return 3;
  if (profile === 'conflicts') return 2;
  return 1;
}

function baseNextDelay(sev) { return sev === 3 ? randInt(80_000,140_000) : sev === 2 ? randInt(60_000,110_000) : randInt(40_000,90_000); }
function cooldown(sev)      { return sev === 3 ? 90_000 : sev === 2 ? 60_000 : 40_000; }

function emitDisruption(io, state, candidate, now) {
  const utteranceText = makeFakeUtterance(candidate.behaviorProfile);
  const severity = severityByProfile(candidate.behaviorProfile);
  const disruptionId = randomUUID();

  state.history.push({
    type: 'disruption',
    disruptionId,
    studentId: candidate.id,
    text: utteranceText,
    severity,
    ts: now,
  });
  candidate.cooldownUntil = now + cooldown(severity);

  io.to(state.room).emit('disruption', { disruptionId, studentId: candidate.id, utteranceText, ts: now });
  return severity;
}

async function tick(io, state) {
  const now = Date.now();
  if (!state.active) return;
  if (now >= (state.endsAt || 0)) return; // נגמר השיעור
  if (state.micOn) return;                 // לא בזמן דיבור המורה

  if (now >= state.nextAt) {
    // כמה להפריע עכשיו? 1 ברירת מחדל, לפעמים 2-3 יחד כדי ליצור עומס
    const burst = Math.random() < 0.35 ? 2 : 1; // 35% לסדרה כפולה
    let usedIds = [];
    let maxSevInBurst = 1;

    for (let i=0; i<burst; i++) {
      const candidate = pickStudent(state, now, usedIds);
      if (!candidate) break;
      usedIds.push(candidate.id);

      const sev = emitDisruption(io, state, candidate, now + i*150 /*פער קטן*/);
      if (sev > maxSevInBurst) maxSevInBurst = sev;
    }

    // תור הבא
    state.nextAt = now + baseNextDelay(maxSevInBurst) * (burst >= 2 ? 0.85 : 1.0);
  }
}

function startBehaviorLoop({ io, room }) {
  const state = ensureSession(room);
  state.room = room;
  if (state.timer) return;
  state.timer = setInterval(() => tick(io, state).catch(()=>{}), 1200);
}

function stopBehaviorLoop(sessionId) {
  const st = sessions.get(sessionId);
  if (st?.timer) clearInterval(st.timer);
  sessions.delete(sessionId);
}

function setMic(sessionId, isOn) {
  ensureSession(sessionId).micOn = !!isOn;
}

function activateLesson(sessionId, durationMs) {
  const st = ensureSession(sessionId);
  const now = Date.now();
  st.active = true;
  st.startedAt = now;
  st.endsAt = now + (durationMs || 5*60*1000);
  st.nextAt = now + randInt(30_000, 70_000);
}

function deactivateLesson(sessionId) {
  const st = ensureSession(sessionId);
  st.active = false;
}

function pushTeacherResponse(sessionId, { disruptionId, text, ts }) {
  const st = ensureSession(sessionId);
  st.history.push({ type: 'teacher', replyTo: disruptionId, text: text || '', ts: ts || Date.now() });
}

function upsertStudents(sessionId, studentsArr) {
  const st = ensureSession(sessionId);
  const byId = Object.fromEntries(st.students.map(s => [s.id, s]));
  for (const s of studentsArr) {
    const prev = byId[s.id] || {};
    byId[s.id] = {
      id: s.id,
      name: s.name || prev.name || s.id,
      behaviorProfile: s.behaviorProfile || prev.behaviorProfile || 'neutral',
      cooldownUntil: prev.cooldownUntil || 0,
      position: s.position || prev.position || [0, 0.85, 0],
    };
  }
  st.students = Object.values(byId);
}

function updateStudentPosition(sessionId, { id, position }) {
  const st = ensureSession(sessionId);
  const s = st.students.find(x => x.id === id);
  if (s) s.position = position;
}

module.exports = {
  sessions,
  ensureSession,
  startBehaviorLoop,
  stopBehaviorLoop,
  setMic,
  activateLesson,
  deactivateLesson,
  pushTeacherResponse,
  upsertStudents,
  updateStudentPosition,
};
