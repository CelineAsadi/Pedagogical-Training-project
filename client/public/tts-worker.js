// client/public/tts-worker.js

self.onmessage = function (e) {
  const { base64 } = e.data;

  try {
    // Create audio element inside the worker context
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);

    audio.onended = () => {
      self.postMessage({ ok: true });
    };

    audio.onerror = () => {
      self.postMessage({ ok: false, error: "Audio playback failed" });
    };

    audio.play();
  } catch (err) {
    self.postMessage({ ok: false, error: err.message });
  }
};
