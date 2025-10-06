// בוחר תלמיד "מועמד להפרעה" ויוצר משפט דמה (אפשר להחליף אח"כ ל-OpenAI + Google TTS)

function pickStudentForDisruption(classroom) {
  const weights = {
    attention: 3, talker: 3, defiant: 2, sensitive: 1, withdrawn: 1,
    conflicts: 2, sarcastic: 1, hyperactive: 2, neutral: 0.3,
  };
  const students = classroom?.students || [];
  const pool = [];
  students.forEach(s => {
    const w = weights[s.behaviorProfile] || 1;
    for (let i = 0; i < Math.round(w * 2); i++) pool.push(s);
  });
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

const utteranceTemplates = {
  attention:  ["המורה… משעמם לי, אפשר משהו אחר?", "אפשר לצאת לשירותים עכשיו?"],
  talker:     ["רגע, אני רק מספר לו משהו…", "מי לקח לי את המחברת?"],
  defiant:    ["אני לא עושה את זה, זה לא הוגן.", "עזבי אותי, אין לי כוח."],
  sensitive:  ["זה מעליב אותי…", "אני לא מרגיש טוב."],
  withdrawn:  ["(לא עונה, ממלמל)", "…"],
  conflicts:  ["הוא התחיל! הוא לקח לי!", "תחזיר לי, נו!"],
  sarcastic:  ["וואו, איזה שיעור מעניין…", "כן בטח, עכשיו כולנו נשתוק…"],
  hyperactive:["אפשר לצאת לריצה?", "אני לא יכול לשבת בשקט!"],
  neutral:    ["אפשר שאלה?"]
};

function sampleUtterance(profile) {
  const arr = utteranceTemplates[profile] || utteranceTemplates.neutral;
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateDisruption({ classroom, teacherProfile, lastTeacherResponse }) {
  const student = pickStudentForDisruption(classroom) || { id: 'X', name: 'Student', behaviorProfile: 'attention' };
  const text = sampleUtterance(student.behaviorProfile);
  return {
    studentId: student.id,
    studentName: student.name,
    behaviorProfile: student.behaviorProfile,
    severity: student.behaviorProfile === 'defiant' ? 'medium' : 'low',
    utteranceText: text,
    ttsUrl: null, // בהמשך: URL מ-Google TTS
    timestamp: Date.now(),
  };
}

module.exports = { generateDisruption };
