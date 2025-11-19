// client/src/lib/studentVoices.js

// לכל תלמיד נשמור "פרופיל קול": קול בסיסי + pitch + rate
const studentVoices = {}; 
// { [studentId]: { voiceName, langHint, pitch, rate } }

function getVoices() {
  if (!("speechSynthesis" in window)) return [];
  const synth = window.speechSynthesis;
  const voices = synth.getVoices() || [];

  if (!voices.length) {
    synth.onvoiceschanged = () => synth.getVoices();
  }

  // פעם אחת אפשר לראות בקונסול מה יש לך:
  console.log(
    "📜 Available voices:",
    voices.map((v) => `${v.name} (${v.lang})`)
  );

  return voices;
}

// פונקציה קטנה ל"seed" קבוע לפי studentId (כדי שיהיה עקבי)
function hashTo01(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000; // מספר בין 0 ל-1
}

// בוחרת קול בסיסי (כנראה Asaf) + מחשבת pitch/rate לפי מגדר ואופי
function createVoiceProfileForStudent({ studentId, gender = "M", langHint = "he-IL", behaviorProfile }) {
  const voices = getVoices();
  const lowerLang = langHint.toLowerCase();

  // קודם מנסים למצוא קול בעברית
  let candidates = voices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith(lowerLang)
  );

  if (!candidates.length) {
    const prefix = lowerLang.split("-")[0]; // he / ar / en
    candidates = voices.filter(
      (v) => v.lang && v.lang.toLowerCase().startsWith(prefix)
    );
  }

  // אם אין בכלל – ניקח כל קול שיש
  if (!candidates.length && voices.length) {
    candidates = voices;
  }

  const baseVoice = candidates[0] || null; // כנראה Asaf

  // לייצר "רנדום קבוע" לפי studentId – שונה כל תלמיד, אבל תמיד אותו דבר לו
  const rnd = hashTo01(studentId);

  // // ברירת מחדל
  // let pitch = 1.05;
  // let rate = 1.0;

  // 3. התאמה לגיל יסודי — קול גבוה וצעיר יותר
  let pitch = 1.20 + rnd * 0.15; // טווח 1.20 – 1.35
  let rate = 1.10 + rnd * 0.10;  // טווח 1.10 – 1.20

  // // קצת שונות לפי מגדר
  // if (gender === "F") {
  //   pitch = 1.05 + rnd * 0.2; // בערך 1.05–1.25
  //   rate = 1.0 + rnd * 0.1;   // בערך 1.0–1.1
  // } else {
  //   pitch = 0.9 + rnd * 0.2;  // בערך 0.9–1.1
  //   rate = 0.9 + rnd * 0.1;   // בערך 0.9–1.0
  // }

  
  // 4. התאמת טון לפי מגדר
  if (gender === "F") {
    pitch += 0.08; // בנות נשמעים מעט יותר גבוה
  } else {
    pitch -= 0.05; // בנים מעט נמוך יותר
  }
  
  // // התאמה לפי פרופיל התנהגות (אופציונלי, אבל נחמד)
  // if (behaviorProfile === "hyperactive") {
  //   rate += 0.15; // מדבר מהר יותר
  // } else if (behaviorProfile === "withdrawn") {
  //   rate -= 0.1;  // מדבר יותר לאט
  //   pitch -= 0.05;
  // } else if (behaviorProfile === "sensitive") {
  //   pitch += 0.05;
  // } else if (behaviorProfile === "sarcastic") {
  //   pitch -= 0.05;
  // }

// 5. התאמות עדינות לפי פרופיל התנהגות
  switch (behaviorProfile) {
    case "hyperactive":
      rate += 0.12; // מדבר מהר יותר
      break;
    case "withdrawn":
      rate -= 0.10; // מדבר לאט יותר
      pitch -= 0.05;
      break;
    case "sensitive":
      pitch += 0.05;
      break;
    case "sarcastic":
      pitch -= 0.05;
      break;
    case "defiant":
      rate -= 0.05;
      break;
    default:
      break;
  }

  // // הגבלת ערכים
  // pitch = Math.max(0.9, Math.min(1.5, pitch));
  // rate = Math.max(0.7, Math.min(1.4, rate));

  
  // 6. מגבלות קשוחות כדי לשמור על "קול ילדי"
  pitch = Math.max(1.0, Math.min(1.5, pitch)); // תמיד גבוה יחסית
  rate = Math.max(0.95, Math.min(1.3, rate));

  const profile = {
    voiceName: baseVoice?.name || null,
    langHint: baseVoice?.lang || langHint,
    pitch,
    rate,
  };

  console.log("🎙️ Elementary voice profile for", studentId, profile);
  return profile;
}

export function speakStudentUtterance({ studentId, gender = "M", text, langHint = "he-IL", behaviorProfile }) {
  if (!text) return;
  if (!("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;
  const voices = getVoices();

  // אם אין לתלמיד עדיין פרופיל – ניצור
  if (!studentVoices[studentId]) {
    studentVoices[studentId] = createVoiceProfileForStudent({
      studentId,
      gender,
      langHint,
      behaviorProfile,
    });
  }

  const info = studentVoices[studentId];

  let voice = null;
  if (info.voiceName) {
    voice = voices.find((v) => v.name === info.voiceName) || null;
  }

  const u = new SpeechSynthesisUtterance(text);

  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = info.langHint || langHint;
  }

  // פה הקסם: לכל תלמיד pitch/rate שונים
  u.pitch = info.pitch;
  u.rate = info.rate;

  console.log(
    "🔊 speakStudentUtterance:",
    text,
    "voice:",
    voice?.name,
    "lang:",
    u.lang,
    "pitch:",
    u.pitch,
    "rate:",
    u.rate
  );

  synth.speak(u);
}
