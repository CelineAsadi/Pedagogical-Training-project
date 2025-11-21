const { synthesizeVoiceBase64 } = require("../services/tts.service");

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
