import { useEffect, useRef, useState } from "react";
/**
 * 
 * Low-level audio frame analysis
 * Extracts:
 * - volume (RMS energy)
 * - pitch (basic autocorrelation)
 * Called on every animation frame
 */
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
 * High-level tone classification
 * Maps raw audio features → pedagogical tone
 * Used by feedback & summary logic
 */
function estimateTone(volume, pitch) {
  const v = volume;
  if (v < 0.01) {
    if (pitch < 170) return "calm";
    return "soft";
  }
  if (v < 0.035) {
    return "neutral";
  }
  if (v < 0.09) {
    if (pitch > 230) return "stressed"; 
    return "firm"; 
  }
  if (v < 0.18) {
    if (pitch > 250) return "stressed";
    return "firm";
  }
  if (pitch > 260) return "angry";
  return "loud";
}

/**
 * useTeacherVoiceAnalysis
 * Purpose:
 * - Continuously analyze teacher microphone input
 * - Extract voice features in real time:
 *   volume, pitch, and pedagogical tone
 * Used during active simulation only
 */
export function useTeacherVoiceAnalysis({ enabled }) {
    // Public state returned to UI / logic
  const [features, setFeatures] = useState({
    volume: 0,
    pitch: 0,
    tone: "neutral",
  });
    // Audio system refs (persistent)
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const rafIdRef = useRef(null);
  const streamRef = useRef(null);
    // Cleanup helper
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
    // Main lifecycle: start / stop analysis
  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }
    let mounted = true;
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
                // Web Audio graph setup
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
                    // Smooth values to avoid jitter
          setFeatures((prev) => {
            const alpha = 0.2; 
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
    return () => {
      mounted = false;
      cleanup();
    };
  }, [enabled]); 
  return { features }; // { volume, pitch, tone }
}
