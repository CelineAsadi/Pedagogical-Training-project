/**
 * Text-to-Speech Service
 * This file implements text-to-speech (TTS) synthesis using
 * Google Cloud Text-to-Speech.
 * It supports both local development and cloud deployment
 * (e.g., Render) by dynamically configuring credentials
 * from either an environment variable or a local service account file.
 * The service generates Hebrew speech audio based on
 * gender-specific voice profiles and returns the result
 * as a Base64-encoded MP3 string for client-side playback.
 */
const textToSpeech = require("@google-cloud/text-to-speech");
const path = require("path");
let client;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith("{")) {
  // Running on Render (JSON in env)
  client = new textToSpeech.TextToSpeechClient({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  });
} else {
  // Running locally (using file)
  client = new textToSpeech.TextToSpeechClient({
    keyFilename: path.join(__dirname, "../config/tts-service-account.json"),
  });
}
const VOICE_BY_GENDER = {
  M: {
    name: "he-IL-Wavenet-B", 
    ssmlGender: "MALE",
  },
  F: {
    name: "he-IL-Wavenet-A", 
    ssmlGender: "FEMALE",
  },
  neutral: {
    name: "he-IL-Wavenet-B",
    ssmlGender: "NEUTRAL",
  },
};

/**
 * Synthesizes speech audio from text and returns it as a Base64 string.
 * This function:
 * - Selects a Hebrew voice based on the requested gender
 * - Applies optional pitch and speaking rate adjustments
 * - Calls Google Cloud Text-to-Speech to generate audio
 * - Encodes the resulting MP3 audio in Base64 format
 */
exports.synthesizeVoiceBase64 = async ({
  text,
  gender = "M",
  pitch = 0,
  rate = 1.0,
}) => {
  const g = gender === "F" ? "F" : gender === "M" ? "M" : "neutral";
  const voiceCfg = VOICE_BY_GENDER[g] || VOICE_BY_GENDER.neutral;
  const request = {
    input: { text },
    voice: {
      languageCode: "he-IL",
      ssmlGender: voiceCfg.ssmlGender,
      name: voiceCfg.name,
    },
    audioConfig: {
      audioEncoding: "MP3",
      pitch,       
      speakingRate: rate,
    },
  };
  const [response] = await client.synthesizeSpeech(request);
  if (!response.audioContent) {
    console.error("TTS: empty audioContent from Google");
    return "";
  }
  return response.audioContent.toString("base64");
};
