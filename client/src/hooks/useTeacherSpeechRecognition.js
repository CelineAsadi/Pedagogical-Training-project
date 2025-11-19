// client/src/hooks/useTeacherSpeechRecognition.js
import { useEffect, useRef } from "react";

/**
 * Hook לזיהוי דיבור של המורה + fallback כשאין final
 *
 * props:
 * - enabled: האם להפעיל/להפסיק זיהוי דיבור
 * - language: קוד שפה ("he-IL", "en-US" וכו')
 * - onFinalUtterance(text, meta): נקרא כשיש משפט סופי (אמיתי או fallback)
 * - onInterimUpdate(text): נקרא בזמן אמת תוך כדי דיבור (טיוטה)
 * - onAudioFeatures({ rms, pitchHz, timestamp }): מדדים מהקול (לא חובה להשתמש)
 */
export function useTeacherSpeechRecognition({
  enabled,
  language = "he-IL",
  onFinalUtterance,
  onInterimUpdate,
  onAudioFeatures,
}) {
  // === refs לפונקציות (כדי לא לשבור useEffect) ===
  const finalCbRef = useRef(null);
  const interimCbRef = useRef(null);
  const audioCbRef = useRef(null);

  useEffect(() => {
    finalCbRef.current = onFinalUtterance || null;
  }, [onFinalUtterance]);

  useEffect(() => {
    interimCbRef.current = onInterimUpdate || null;
  }, [onInterimUpdate]);

  useEffect(() => {
    audioCbRef.current = onAudioFeatures || null;
  }, [onAudioFeatures]);

  // --- SR (SpeechRecognition) ---
  const recognitionRef = useRef(null);

  // האם כרגע recognition מאזין בפועל (מניעת start כפול)
  const isListeningRef = useRef(false);
  // האם המערכת *רוצה* להיות במצב האזנה (נגזר מ-enabled)
  const shouldBeListeningRef = useRef(false);

  // נשמור את ה־interim האחרון + זמן העדכון שלו
  const lastInterimTextRef = useRef("");
  const lastInterimTimeRef = useRef(0);

  // טיימר לבדיקת "שקט" → fallback
  const fallbackTimerRef = useRef(null);

  // --- Audio (עוצמה / pitch) ---
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);

  /* =========================================================
   * 1) הקמת SpeechRecognition – פעם אחת (או כשמשנים language)
   * =======================================================*/
  useEffect(() => {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn("SpeechRecognition not available in this browser");
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;

    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListeningRef.current = true;
      console.log("🎙️ SR engine started");
    };

    recognition.onerror = (event) => {
      // "aborted" זה בדרך כלל stop יזום → לא צריך להפחיד
      if (event.error === "aborted") {
        // console.debug("SR aborted (normal stop)");
        return;
      }
      console.warn(
        "⚠️ SR error:",
        event.error,
        event.message || ""
      );
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      console.log("🛑 SR engine ended");

      // אם עדיין אמור להיות במצב האזנה – ננסה להפעיל מחדש פעם אחת
      if (shouldBeListeningRef.current) {
        try {
          console.log("🔁 SR auto-restart");
          recognition.start();
          isListeningRef.current = true;
        } catch (e) {
          console.warn("SR restart error:", e);
        }
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript || "";
        if (!text) continue;

        if (res.isFinal) {
          finalTranscript += text + " ";
        } else {
          interimTranscript += text + " ";
        }
      }

      // 🟡 interim – טיוטה בזמן אמת
      if (interimTranscript.trim()) {
        const clean = interimTranscript.trim();
        lastInterimTextRef.current = clean;
        lastInterimTimeRef.current = Date.now();
        if (interimCbRef.current) interimCbRef.current(clean);
      }

      // 🟢 final אמיתי מהדפדפן
      if (finalTranscript.trim()) {
        const clean = finalTranscript.trim();
        lastInterimTextRef.current = "";
        lastInterimTimeRef.current = 0;

        if (finalCbRef.current) {
          finalCbRef.current(clean, {
            source: "browser-final", // לצורך דיבוג
          });
        }
      }
    };

    return () => {
      shouldBeListeningRef.current = false;
      isListeningRef.current = false;
      try {
        recognition.stop();
      } catch (e) {}
      recognitionRef.current = null;
    };
  }, [language]);

  /* =========================================================
   * 2) fallback timer: אין final? נשתמש ב-interim אחרי X זמן
   * =======================================================*/
  useEffect(() => {
    const SILENCE_WINDOW_MS = 4000; // 4 שניות שקט
    const CHECK_EVERY_MS = 500; // בדיקה כל חצי שנייה

    // מנקים טיימר קודם אם קיים
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (!enabled) {
      console.log("🛑 SR stop (enabled=false) – fallback timer off");
      return;
    }

    // מפעילים טיימר חדש
    fallbackTimerRef.current = setInterval(() => {
      const txt = lastInterimTextRef.current;
      if (!txt) return;

      const lastTime = lastInterimTimeRef.current || 0;
      const elapsed = Date.now() - lastTime;

      if (elapsed > SILENCE_WINDOW_MS) {
        // ✅ נחשיב את ה-interim כתגובה סופית
        console.log("⏱️ Fallback → treating interim as final:", txt);

        lastInterimTextRef.current = "";
        lastInterimTimeRef.current = 0;

        if (finalCbRef.current) {
          finalCbRef.current(txt, {
            source: "fallback-interim", // לאבחנה מה-browser-final
          });
        }
      }
    }, CHECK_EVERY_MS);

    return () => {
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [enabled]);

  /* =========================================================
   * 3) שליטה בהפעלה/עצירה של SR עצמו
   * =======================================================*/
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (enabled) {
      console.log("🎙️ SR start (enabled=true)");
      shouldBeListeningRef.current = true;

      // נתחיל רק אם לא מאזין כבר
      if (!isListeningRef.current) {
        try {
          recognition.start();
          isListeningRef.current = true;
        } catch (e) {
          console.warn("SR start error:", e);
        }
      }
    } else {
      console.log("🛑 SR stop (enabled=false)");
      shouldBeListeningRef.current = false;

      if (isListeningRef.current) {
        try {
          recognition.stop();
        } catch (e) {}
        isListeningRef.current = false;
      }
    }
  }, [enabled]);

  /* =========================================================
   * 4) AudioContext לניתוח עוצמה / pitch (אופציונלי)
   *    אם לא שולחים onAudioFeatures – לא נפתח מיקרופון מכאן
   * =======================================================*/
  useEffect(() => {
    // אם לא צריך מדדים – לא נפתח סטרים נוסף
    if (!enabled || !audioCbRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn("getUserMedia not supported");
      return;
    }

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        console.log("🎤 Mic stream acquired for teacher (SR metrics):", stream);

        const AudioCtx =
          window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          console.warn("AudioContext not supported");
          return;
        }

        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        const tick = () => {
          if (!analyserRef.current || !dataArrayRef.current) return;

          analyser.getByteTimeDomainData(dataArray);

          // RMS = עוצמת קול משוערת
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128; // -1..1
            sum += v * v;
          }
          const rms = Math.sqrt(sum / bufferLength);

          // Pitch מאוד גס ע"י zero-crossings (רק אינדיקציה, לא מדויק)
          let crossings = 0;
          let last = dataArray[0] - 128;
          for (let i = 1; i < bufferLength; i++) {
            const cur = dataArray[i] - 128;
            if (
              (last <= 0 && cur > 0) ||
              (last >= 0 && cur < 0)
            ) {
              crossings++;
            }
            last = cur;
          }

          let pitchHz = null;
          if (crossings > 0 && audioCtx.sampleRate) {
            const freqApprox =
              audioCtx.sampleRate / (bufferLength / crossings) / 2;
            pitchHz = freqApprox;
          }

          if (audioCbRef.current) {
            audioCbRef.current({
              rms,
              pitchHz,
              timestamp: performance.now(),
            });
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      })
      .catch((err) => {
        console.warn("Mic error:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  /* =========================================================
   * 5) ניקוי כללי כשעוזבים את המסך / מכבים הכל
   * =======================================================*/
  useEffect(() => {
    return () => {
      // SR
      const recognition = recognitionRef.current;
      shouldBeListeningRef.current = false;
      isListeningRef.current = false;
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }

      // fallback timer
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }

      // Audio
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);
}
