/**
 * Text-to-Speech Controller
 * ------------------------
 * This file provides an API endpoint for converting text into synthesized speech.
 *
 * It is primarily used to generate student voices dynamically during
 * classroom simulations, allowing control over voice characteristics
 * such as gender, pitch, and speaking rate.
 *
 * The generated audio is returned as a Base64-encoded string.
 */
const { synthesizeVoiceBase64 } = require("../services/tts.service");

/**
 * Converts input text into synthesized speech for a student avatar.
 * Validates input text and delegates speech synthesis to the TTS service.
 * Supports customization of voice characteristics.
 */
exports.speakForStudent = async (req, res) => {
  try {
    const { text, gender, pitch, rate } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Text is required" });
    }
    const audioBase64 = await synthesizeVoiceBase64({
      text,
      gender: gender || "M",
      pitch: pitch ?? 0,
      rate: rate ?? 1.0,
    });
    res.status(200).json({ audioBase64 });
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ message: "TTS synthesis failed" });
  }
};
