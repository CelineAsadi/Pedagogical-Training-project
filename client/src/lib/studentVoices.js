// client/src/lib/studentVoices.js
import { axiosInstance } from "./axios";

// שומר פרופיל קולי לכל תלמיד
const studentVoiceProfiles = {};

/** יצירת פרופיל לכל תלמיד (מוגדר לפי gender + behaviorProfile) */
function createVoiceProfile(studentId, gender, behaviorProfile) {
  const rnd = Math.random();

  let pitch = 0;
  let rate = 1.0;

  // 🎤 התאמות לפי מגדר
  if (gender === "F") pitch += 2;
  if (gender === "M") pitch -= 1;

  // 🎭 התאמות לפי סוג התלמיד
  switch (behaviorProfile) {
    case "hyperactive":
      rate += 0.3;
      break;
    case "withdrawn":
      rate -= 0.15;
      pitch -= 1;
      break;
    case "sarcastic":
      pitch -= 0.5;
      break;
    case "sensitive":
      pitch += 0.5;
      break;
    case "defiant":
      rate -= 0.1;
      break;
    default:
      break;
  }

  studentVoiceProfiles[studentId] = {
    pitch,
    rate,
    gender,
  };

  return studentVoiceProfiles[studentId];
}

/** 🎧 הפונקציה הראשית — השמעת טקסט עם Google TTS */
export async function speakStudentUtterance({ studentId, gender = "M", text, behaviorProfile }) {
  if (!text) return;

  // צור פרופיל אם אין
  if (!studentVoiceProfiles[studentId]) {
    createVoiceProfile(studentId, gender, behaviorProfile);
  }

  const prof = studentVoiceProfiles[studentId];

  try {
    // בקשה לשרת לקבל אודיו Base64
    const res = await axiosInstance.post(
      "/tts/tts",
      {
        text,
        gender: prof.gender,
        pitch: prof.pitch,
        rate: prof.rate,
      },
      { withCredentials: true }
    );

    if (!res.data?.ok) {
      console.warn("TTS failed:", res.data);
      return;
    }

    const audioBase64 = res.data.audio;

    // 🔊 השמעת האודיו
    const audio = new Audio(audioBase64);
    audio.play().catch((err) => console.error("Audio play error:", err));

  } catch (err) {
    console.error("TTS Error:", err);
  }
}
