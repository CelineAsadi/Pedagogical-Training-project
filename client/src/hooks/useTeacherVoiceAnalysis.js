// client/src/hooks/useTeacherVoiceAnalysis.js
import { useEffect, useRef, useState } from "react";

// --- חישוב עוצמת קול (RMS) + pitch גס ---
function analyzeFrame(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  const volume = rms;

  let bestOffset = -1;
  let bestCorrelation = 0;
  const minLag = Math.floor(sampleRate / 500);
  const maxLag = Math.floor(sampleRate / 80);

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < buffer.length - lag; i++) {
      corr += buffer[i] * buffer[i + lag];
    }
    if (corr > bestCorrelation) {
      bestCorrelation = corr;
      bestOffset = lag;
    }
  }

  let pitch = 0;
  if (bestOffset > 0) {
    pitch = sampleRate / bestOffset;
  }

  return { volume, pitch };
}

function estimateTone(volume, pitch) {
  if (volume < 0.015) {
    if (pitch < 150) return "calm";
    return "soft";
  }

  if (volume < 0.04) {
    return "neutral";
  }

  if (volume >= 0.04 && volume < 0.1) {
    if (pitch > 220) return "stressed";
    return "firm";
  }

  if (pitch > 250) return "angry";
  return "loud";
}

/**
 * מחזיר: { volume, pitch, tone }
 */
export function useTeacherVoiceAnalysis({ enabled }) {
  const [features, setFeatures] = useState({
    volume: 0,
    pitch: 0,
    tone: "neutral",
  });

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const rafIdRef = useRef(null);
  const streamRef = useRef(null);

  // פונקציית ניקוי אחת, בטוחה
  const cleanup = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const ac = audioContextRef.current;
    if (ac && ac.state !== "closed") {
      ac.close().catch(() => {});
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
  };

  useEffect(() => {
    if (!enabled) {
      // אם המיקרופון כבוי – רק מנקים
      cleanup();
      return;
    }

    let mounted = true;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          // אם בינתיים unmount – לעצור את הזרם
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const source = ac.createMediaStreamSource(stream);
        const analyser = ac.createAnalyser();
        analyser.fftSize = 2048;

        source.connect(analyser);

        audioContextRef.current = ac;
        analyserRef.current = analyser;
        sourceRef.current = source;

        const buffer = new Float32Array(analyser.fftSize);

        function loop() {
          if (!mounted || !analyserRef.current || !audioContextRef.current) {
            return;
          }

          analyserRef.current.getFloatTimeDomainData(buffer);
          const { volume, pitch } = analyzeFrame(buffer, audioContextRef.current.sampleRate);
          const tone = estimateTone(volume, pitch);

          setFeatures({ volume, pitch, tone });

          rafIdRef.current = requestAnimationFrame(loop);
        }

        loop();
      } catch (err) {
        console.error("🎤 Voice analysis init failed:", err);
      }
    }

    init();

    // cleanup כשיוצאים מהאפקט (unmount או שינוי enabled)
    return () => {
      mounted = false;
      cleanup();
    };
  }, [enabled]); // כל שינוי ב-enabled מפעיל/מנקה

  return { features }; // { volume, pitch, tone }
}
