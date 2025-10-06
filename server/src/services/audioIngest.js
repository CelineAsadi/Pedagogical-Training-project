// server/src/services/audioIngest.js
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeChunk(buffer) {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  const filePath = path.join(tmpDir, `chunk_${Date.now()}_${Math.random().toString(36).slice(2)}.webm`);
  fs.writeFileSync(filePath, Buffer.from(buffer));

  try {
    const resp = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
    });
    return resp.text?.trim() || '';
  } finally {
    fs.unlink(filePath, () => {});
  }
}

module.exports = { transcribeChunk };
