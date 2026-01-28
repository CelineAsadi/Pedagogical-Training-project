/**
 * Student Text-to-Speech (TTS) Utilities
 * This module is responsible for:
 * - Generating consistent voice profiles for students
 * - Customizing pitch and speaking rate based on
 *   gender and behavior profile
 * - Requesting synthesized speech from the backend
 * - Playing student speech audio in the virtual classroom
 * The goal is to create realistic and consistent
 * student voices across the simulation.
 */
const studentVoiceProfiles = {};
/**
 * Generates a deterministic pseudo-random number (0–1)
 * from a string input (studentId).
 * Used to ensure each student gets a stable
 * but unique voice profile across sessions.
 */
function hashTo01(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000; // from 0 to 1
}
/**
 * Builds and stores a voice profile for a student
 * based on:
 * - Gender
 * - Behavior profile
 * - Deterministic randomness (studentId)
 * The profile controls:
 * - pitch (voice height)
 * - rate (speaking speed)
 */
function buildVoiceProfile({ studentId, gender = "M", behaviorProfile }) {
  const rnd = hashTo01(studentId);
  let pitch; 
  let rate;  
  if (gender === "F") {
    pitch = 4 + rnd * 2;        // 4–6
    rate = 1.10 + rnd * 0.10;   // 1.10–1.20
  } else if (gender === "M") {
    pitch = 2 + rnd * 2;        // 2–4
    rate = 1.05 + rnd * 0.10;   // 1.05–1.15
  } else {
    pitch = 3 + rnd * 2;        // 3–5
    rate = 1.05 + rnd * 0.10;
  }
  switch ((behaviorProfile || "").toLowerCase()) {
    case "hyperactive":
      rate += 0.15; 
      break;
    case "withdrawn":
      rate -= 0.10; 
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
  pitch = Math.max(-5, Math.min(10, pitch));
  rate = Math.max(0.8, Math.min(1.6, rate));
  const profile = { gender, pitch, rate, behaviorProfile };
  studentVoiceProfiles[studentId] = profile;
  console.log("🎙️ Voice profile for", studentId, profile);
  return profile;
}
/**
 * Sends a TTS request to the backend and
 * returns the synthesized audio as base64.
 * Backend handles Google Cloud Text-to-Speech.
 */
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
/**
 * Plays synthesized speech for a student.
 * - Creates (or reuses) a student voice profile
 * - Requests audio from the backend
 * - Plays the resulting MP3 in the browser
 * This function is triggered when a student
 * speaks during the simulation.
 */
export async function playTTSAudio({
  text,
  gender = "M",
  studentId = "anon",
  behaviorProfile = "neutral",
}) {
  try {
    if (!text) return;
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