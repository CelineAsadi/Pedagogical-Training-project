/**
 * useTeacherSpeechRecognition
 * Handles:
 * - Browser SpeechRecognition (final + interim results)
 * - Auto-restart when SR stops unexpectedly
 * - Fallback logic: treat long interim speech as final
 * - Optional audio feature extraction (volume / pitch)
 * Used during lesson simulation to capture teacher speech
 */
import { useEffect, useRef } from "react";

export function useTeacherSpeechRecognition({
  enabled,
  language = "he-IL",
  onFinalUtterance,
  onInterimUpdate,
  onAudioFeatures,
}) {
  // 1️ Stable callback references
  // Prevent stale closures inside SR event handlers
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
  // 2️ SpeechRecognition state refs
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const shouldBeListeningRef = useRef(false);
  // Track interim speech for fallback logic
  const lastInterimTextRef = useRef("");
  const lastInterimTimeRef = useRef(0);
  // Fallback timer (interim → final)
  const fallbackTimerRef = useRef(null);
  // Audio analysis refs
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);
  // 3️ Initialize SpeechRecognition engine
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
      if (event.error === "aborted") {
        return;
      }
      console.warn(
        "⚠️ SR error:",
        event.error,
        event.message || ""
      );
    };
    // Auto-restart SR if it stops unexpectedly
    recognition.onend = () => {
      isListeningRef.current = false;
      console.log("🛑 SR engine ended");
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
    // 4️ Handle speech results
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
      // Interim speech (live feedback)
      if (interimTranscript.trim()) {
        const clean = interimTranscript.trim();
        lastInterimTextRef.current = clean;
        lastInterimTimeRef.current = Date.now();
        if (interimCbRef.current) interimCbRef.current(clean);
      }
      // Final speech (confirmed utterance)
      if (finalTranscript.trim()) {
        const clean = finalTranscript.trim();
        lastInterimTextRef.current = "";
        lastInterimTimeRef.current = 0;
        if (finalCbRef.current) {
          finalCbRef.current(clean, {
            source: "browser-final", 
          });
        }
      }
    };
    // Cleanup SR engine
    return () => {
      shouldBeListeningRef.current = false;
      isListeningRef.current = false;
      try {
        recognition.stop();
      } catch (e) {}
      recognitionRef.current = null;
    };
  }, [language]);
  // 5️ Fallback: interim → final after silence
  useEffect(() => {
    const SILENCE_WINDOW_MS = 4000; 
    const CHECK_EVERY_MS = 500; 
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (!enabled) {
      console.log("🛑 SR stop (enabled=false) – fallback timer off");
      return;
    }
    fallbackTimerRef.current = setInterval(() => {
      const txt = lastInterimTextRef.current;
      if (!txt) return;
      const lastTime = lastInterimTimeRef.current || 0;
      const elapsed = Date.now() - lastTime;
      if (elapsed > SILENCE_WINDOW_MS) {
        console.log("⏱️ Fallback → treating interim as final:", txt);
        lastInterimTextRef.current = "";
        lastInterimTimeRef.current = 0;
        if (finalCbRef.current) {
          finalCbRef.current(txt, {
            source: "fallback-interim", 
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
  // 6️ Start / stop SR based on `enabled`
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (enabled) {
      console.log("🎙️ SR start (enabled=true)");
      shouldBeListeningRef.current = true;
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
  // 7️ Audio feature extraction (RMS + pitch)
  useEffect(() => {
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
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128; // -1..1
            sum += v * v;
          }
          const rms = Math.sqrt(sum / bufferLength);
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
  // 8️ Full cleanup on unmount
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