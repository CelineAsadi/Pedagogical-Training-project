// client/src/lib/ttsClient.js

// 👂 נשמור לכל תלמיד פרופיל קול ייחודי
// { [studentId]: { gender, pitch, rate, behaviorProfile } }
const studentVoiceProfiles = {};

// hash קטן ל-0..1 לפי studentId – כדי שכל תלמיד יקבל מספר קבוע
function hashTo01(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000; // בין 0 ל-1
}

// יצירת פרופיל קול "ילדי" לפי מגדר + פרופיל התנהגות
function buildVoiceProfile({ studentId, gender = "M", behaviorProfile }) {
  const rnd = hashTo01(studentId);

  // בסיס – קול יותר צעיר (טון גבוה ומהירות קצת יותר מהירה)
  let pitch; // Google: 0 = רגיל, 4–6 = גבוה יותר
  let rate;  // 1.0 = רגיל

  if (gender === "F") {
    // ילדה – טון יותר גבוה
    pitch = 4 + rnd * 2;        // 4–6
    rate = 1.10 + rnd * 0.10;   // 1.10–1.20
  } else if (gender === "M") {
    // ילד – קצת פחות גבוה
    pitch = 2 + rnd * 2;        // 2–4
    rate = 1.05 + rnd * 0.10;   // 1.05–1.15
  } else {
    pitch = 3 + rnd * 2;        // 3–5
    rate = 1.05 + rnd * 0.10;
  }

  // התאמות עדינות לפי behaviorProfile
  switch ((behaviorProfile || "").toLowerCase()) {
    case "hyperactive":
      rate += 0.15; // מדבר יותר מהר
      break;
    case "withdrawn":
      rate -= 0.10; // מדבר לאט יותר
      pitch -= 1.0;
      break;
    case "sensitive":
      pitch += 0.5;
      break;
    case "sarcastic":
      pitch -= 0.5;
      break;
    case "defiant":
      rate -= 0.05;
      break;
    default:
      break;
  }

  // הגבלת טווחים סבירים
  // (Google תומך בערך -20..20 pitch, ומהירות 0.25..4)
  pitch = Math.max(-5, Math.min(10, pitch));
  rate = Math.max(0.8, Math.min(1.6, rate));

  const profile = { gender, pitch, rate, behaviorProfile };
  studentVoiceProfiles[studentId] = profile;

  console.log("🎙️ Voice profile for", studentId, profile);
  return profile;
}

// קריאה לשרת שמחזיר לנו Base64 של MP3
export async function fetchTtsAudio({ text, gender, pitch, rate }) {
  const baseUrl =
    process.env.REACT_APP_SERVER_URL || "http://localhost:4000";

  const res = await fetch(`${baseUrl}/api/tts/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, gender, pitch, rate }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("TTS HTTP error", res.status, errText);
    throw new Error(`TTS HTTP error ${res.status}`);
  }

  const data = await res.json();
  return data.audioBase64;
}

// פונקציה נוחה לשימוש בתוך ה-VirtualClassroomCore
export async function playTTSAudio({
  text,
  gender = "M",
  studentId = "anon",
  behaviorProfile = "neutral",
}) {
  try {
    if (!text) return;

    // אם אין לתלמיד עדיין פרופיל – ניצור
    let profile = studentVoiceProfiles[studentId];
    if (!profile) {
      profile = buildVoiceProfile({ studentId, gender, behaviorProfile });
    }

    const audioBase64 = await fetchTtsAudio({
      text,
      gender: profile.gender,
      pitch: profile.pitch,
      rate: profile.rate,
    });

    if (!audioBase64) {
      console.error("❌ TTS Error: empty audioBase64");
      return;
    }

    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
    audio.play();
  } catch (err) {
    console.error("playTTSAudio error:", err);
  }
}