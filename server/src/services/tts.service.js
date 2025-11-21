// server/src/services/tts.service.js
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


// מיפוי קולות בעברית לפי מגדר
// שימי לב: אם A לא עובד אצלך, אפשר להחליף ל-B גם לבנות.
const VOICE_BY_GENDER = {
  M: {
    name: "he-IL-Wavenet-B", // זכר
    ssmlGender: "MALE",
  },
  F: {
    name: "he-IL-Wavenet-A", // נקבה
    ssmlGender: "FEMALE",
  },
  neutral: {
    name: "he-IL-Wavenet-B",
    ssmlGender: "NEUTRAL",
  },
};

/**
 * Synthesize voice and return Base64
 * text  – הטקסט של התלמיד
 * gender – 'M' / 'F' / אחר
 * pitch – שינוי טון (Google: בין ‎-20 ל-20, 0 זה ברירת מחדל)
 * rate  – מהירות דיבור (1.0 = רגיל)
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
      pitch,          // 👈 מקבל מהלקוח
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
