import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import "../style/VirtualClassroomCore.css";

import VirtualClassroomScene from "./VirtualClassroomScene";
import VirtualClassroomHUD from "./VirtualClassroomHUD";

import { useClassroomStore } from "../lib/store";
import { createSocket } from "../lib/socket";
import { playTTSAudio } from "../lib/ttsClient";
import { useTeacherVoiceAnalysis } from "../hooks/useTeacherVoiceAnalysis";
import { useTeacherSpeechRecognition } from "../hooks/useTeacherSpeechRecognition";
import { axiosInstance } from "../lib/axios";
import { flushSync } from "react-dom";

export default function VirtualClassroomCore({ config, sessionId }) {
  if (!sessionId) console.error("❌ Missing sessionId!");

  const setLastDisruption = useClassroomStore((s) => s.setLastDisruption);
  const startDisruption = useClassroomStore((s) => s.startDisruption);
  const addTeacherResponse = useClassroomStore((s) => s.addTeacherResponse);
  const lastDisruption = useClassroomStore((s) => s.lastDisruption);

  const [speakingMap, setSpeakingMap] = useState({});
  const bubbleTimers = useRef(new Map());
  const timerRef = useRef(null);

  const socketRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [timeLeft, setTimeLeft] = useState((config?.duration ?? 5) * 60);

  const { features: voiceFeatures } = useTeacherVoiceAnalysis({
    enabled: started,
  });

  // ---- Speech Recognition ----
  const handleTeacherFinalUtterance = async (teacherText) => {
    try {
      const res = await axiosInstance.post("/feedback/teacher-response", {
        sessionId,
        teacherText,
        voiceFeatures,
        disruption: lastDisruption,
      });

      addTeacherResponse(res.data);
    } catch (err) {}
  };

  useTeacherSpeechRecognition({
    enabled: started,
    language: "he-IL",
    onFinalUtterance: handleTeacherFinalUtterance,
  });

  // ---- Socket ----
  useEffect(() => {
    if (!sessionId) return;

    const socket = createSocket(sessionId);
    socketRef.current = socket;

    socket.on("disruption", (payload) => {
      flushSync(() => {
        startDisruption(payload);
        setLastDisruption(payload);

        setSpeakingMap((prev) => ({
          ...prev,
          [payload.studentId]: payload.utteranceText,
        }));
      });

      // auto clear bubble
      if (bubbleTimers.current.has(payload.studentId))
        clearTimeout(bubbleTimers.current.get(payload.studentId));

      bubbleTimers.current.set(
        payload.studentId,
        setTimeout(() => {
          setSpeakingMap((prev) => {
            const next = { ...prev };
            delete next[payload.studentId];
            return next;
          });
        }, 3000)
      );

      // TTS async
      setTimeout(() => {
        const student = useClassroomStore
          .getState()
          .students.find((s) => s.id === payload.studentId);

        if (student) {
          playTTSAudio({
            text: payload.utteranceText,
            gender: student.gender,
            behaviorProfile: student.behaviorProfile,
          });
        }
      }, 0);
    });

    return () => {
      clearInterval(timerRef.current);
      socket.disconnect();
      bubbleTimers.current.forEach((t) => clearTimeout(t));
    };
  }, [sessionId]);

  // ---- Start lesson ----
  const handleStart = async () => {
    if (!socketRef.current) return;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }

    const duration = (config?.duration ?? 5) * 60;
    socketRef.current.emit("lesson:start", { duration, sessionId });

    setTimeLeft(duration);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleStop();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    setStarted(true);
  };

  // ---- Stop lesson ----
  const handleStop = () => {
    socketRef.current?.emit("lesson:stop", { sessionId });
    clearInterval(timerRef.current);
    setStarted(false);
    setIsRecording(false);
  };

  // ------------------ UI ------------------
  return (
    <div className="vc-container">
      {/* Header */}
      <div className={`vc-header ${started ? "active" : "inactive"}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleStart}
            disabled={started}
            className={`vc-start-btn ${started ? "disabled" : "enabled"}`}
          >
            START
          </button>

          <button
            className="vc-test-voice-btn"
            onClick={() => {
              if (!("speechSynthesis" in window)) return;
              const u = new SpeechSynthesisUtterance(
                "Test voice, one two three"
              );
              u.lang = "he-IL";
              window.speechSynthesis.speak(u);
            }}
          >
            🔊 Test Voice
          </button>

          <span>{started ? "● Recording" : "Inactive"}</span>
        </div>

        <button onClick={handleStop} className="vc-stop-btn">
          ⛔ END
        </button>

        <div className="vc-class-box">
          <span>Class:</span>
          <span>{config?.className}</span>
          <span style={{ marginLeft: 15 }}>🧠 Topic:</span>
          <span>{config?.lessonTopic}</span>
        </div>

        <div>
          TIME ⏱:{" "}
          {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
          {String(timeLeft % 60).padStart(2, "0")}
        </div>

        <div>{isRecording ? "🎤 Mic Active" : "🔇 Mic Off"}</div>

        <button className="vc-hamburger" onClick={() => setIsSidebarOpen(true)}>
          ☰
        </button>
      </div>

      {/* Canvas */}
      <Canvas shadows camera={{ position: [0, 5.8, -7.2], fov: 50 }}>
        <VirtualClassroomScene
          speakingMap={speakingMap}
          onStudentMoved={(id, pos) =>
            socketRef.current?.emit("student:moved", { id, position: pos })
          }
        />
      </Canvas>

      <VirtualClassroomHUD />

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
          ×
        </button>

        <h2>📘 Class Details</h2>
        <p>
          <strong>Name:</strong> {config?.className}
        </p>
        <p>
          <strong>Topic:</strong> {config?.lessonTopic}</p>
        <p>
          <strong>Duration:</strong> {config?.duration} min
        </p>
        <p>
          <strong>Total Students:</strong> {config?.classSize}
        </p>

        <hr />

        <h3>👩‍🏫 Students</h3>
        <ul>
          {useClassroomStore.getState().students.map((s) => (
            <li key={s.id}>
              <strong>{s.name}</strong> – {s.behaviorProfile}
            </li>
          ))}
        </ul>

        <hr />

        <h3>🎚️ Voice Debug</h3>
        <p>Volume: {voiceFeatures.volume.toFixed(3)}</p>
        <p>Pitch: {voiceFeatures.pitch.toFixed(3)}</p>
        <p>Tone: {voiceFeatures.tone}</p>
      </div>

      {isSidebarOpen && (
        <div className="overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}
