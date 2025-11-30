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

/**
 * 🧪 הערכת tone לפי עוצמה וגובה צליל
 *
 * שינינו פה 2 דברים:
 * 1. הספים יותר רכים – צריך עוצמה גבוהה *באמת* כדי להגיע ל-"loud"/"angry".
 * 2. "firm"/"stressed" מכסים את האזור של דיבור קצת חזק, בלי ישר לקרוא לזה צעקות.
 */
function estimateTone(volume, pitch) {
  const v = volume;

  // מאוד שקט – דיבור רגוע / רך
  if (v < 0.01) {
    // pitch נמוך יחסית -> calm, גבוה קצת -> soft
    if (pitch < 170) return "calm";
    return "soft";
  }

  // דיבור רגיל
  if (v < 0.035) {
    return "neutral";
  }

  // דיבור קצת יותר חזק – אבל עדיין לא צעקות
  if (v < 0.09) {
    if (pitch > 230) return "stressed"; // טון לחוץ/גבוה
    return "firm"; // אסרטיבי, קצת חזק
  }

  // עוצמה גבוהה יחסית, אבל עוד לא "צרחות"
  if (v < 0.18) {
    if (pitch > 250) return "stressed";
    return "firm";
  }

  // רק מעל 0.18 נחשיב כ-"loud"/"angry"
  if (pitch > 260) return "angry";
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
          const { volume, pitch } = analyzeFrame(
            buffer,
            audioContextRef.current.sampleRate
          );

          // 🧊 החלקה (smoothing) – כדי שקפיצות קצרות לא יהפכו מיד ל-"loud"
          setFeatures((prev) => {
            const alpha = 0.2; // כמה לתת משקל לחדש (0.2 = 20%)
            const smoothVolume = alpha * volume + (1 - alpha) * prev.volume;
            const smoothPitch = alpha * pitch + (1 - alpha) * prev.pitch;
            const tone = estimateTone(smoothVolume, smoothPitch);

            return {
              volume: smoothVolume,
              pitch: smoothPitch,
              tone,
            };
          });

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
