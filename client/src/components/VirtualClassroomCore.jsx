/**
 * VirtualClassroomCore
 * This file contains the core logic and rendering of the virtual classroom
 * simulation. It is responsible for orchestrating the real-time classroom
 * experience, including 3D rendering, student behavior, audio interaction,
 * and communication with the backend.
 * Main responsibilities:
 * - Render the 3D classroom environment using React Three Fiber
 * - Manage student avatars, desks, and seating positions
 * - Handle real-time disruptions via Socket.IO
 * - Capture and analyze teacher speech (voice + text)
 * - Send teacher responses to the backend for AI feedback
 * - Control lesson lifecycle (start, stop, timer, summary generation)
 * This component intentionally concentrates complex real-time logic in one
 * place, while relying on external hooks and stores for state management and side effects.
 */
import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import "../style/VirtualClassroomCore.css";
import { useNavigate } from "react-router-dom";
import { useClassroomStore, ROOM, SNAP, FACE_FRONT } from "../lib/store";
import { useDragOnFloor, snapVec3, clampToRoom } from "../lib/drag";
import { createSocket } from "../lib/socket";
import StudentAvatar from "./StudentAvatar";
import { playTTSAudio } from "../lib/ttsClient";
import { useTeacherVoiceAnalysis } from "../hooks/useTeacherVoiceAnalysis";
import { useTeacherSpeechRecognition } from "../hooks/useTeacherSpeechRecognition";
import { axiosInstance } from "../lib/axios";
const AVATAR_Y = 0.55;
/* 
 * 3D ROOM & FURNITURE
 * Static 3D components that visually represent the classroom:
 * - RoomShell: walls, floor, ceiling
 * - Desk / Chair: draggable classroom objects
 */
function RoomShell() {
  const w = ROOM.width,
    d = ROOM.depth,
    h = 3;
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#e7e7e7" />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#fafafa" />
      </mesh>
      {/* Back + sides */}
      <mesh position={[0, h / 2, d / 2]}>
        <boxGeometry args={[w, h, 0.08]} />
        <meshStandardMaterial color="#d9d9d9" />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]}>
        <boxGeometry args={[0.08, h, d]} />
        <meshStandardMaterial color="#d9d9d9" />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]}>
        <boxGeometry args={[0.08, h, d]} />
        <meshStandardMaterial color="#d9d9d9" />
      </mesh>
    </group>
  );
}
/* ===== Desk ===== */
function Desk({ item, onSelect }) {
  const moveItem = useClassroomStore((s) => s.moveItem);
  const { startDrag } = useDragOnFloor({
    onDrag: (p) =>
      moveItem(
        item.id,
        snapVec3(clampToRoom([p.x, 0, p.z])),
        item.rotation
      ),
  });
  return (
    <group
      position={item.position}
      rotation={item.rotation}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.id);
        startDrag(e);
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[1.0, 0.65, 0.7]} />
        <meshStandardMaterial color="#718096" />
      </mesh>
    </group>
  );
}
/* ===== Chair ===== */
function Chair({ item, onSelect }) {
  const moveItem = useClassroomStore((s) => s.moveItem);
  const { startDrag } = useDragOnFloor({
    onDrag: (p) =>
      moveItem(
        item.id,
        snapVec3(clampToRoom([p.x, 0, p.z])),
        item.rotation
      ),
  });
  return (
    <group
      position={item.position}
      rotation={item.rotation}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.id);
        startDrag(e);
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#A0AEC0" />
      </mesh>
      <mesh position={[0, 0.45, -0.2]} castShadow>
        <boxGeometry args={[0.05, 0.9, 0.05]} />
        <meshStandardMaterial color="#4A5568" />
      </mesh>
      <mesh position={[0, 0.25, -0.2]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#CBD5E0" />
      </mesh>
    </group>
  );
}
/* 
 * SCENE COMPOSITION
 * Combines all 3D elements into a single scene:
 * - Room shell
 * - Desks and chairs
 * - Student avatars
 * - Lighting and shadows
 * This component reacts to global classroom state and renders
 * the current snapshot of the virtual classroom.
 */
function Scene({ speakingMap, onStudentMoved }) {
  const items = useClassroomStore((s) => s.items);
  const students = useClassroomStore((s) => s.students);
  const studentTransforms = useClassroomStore((s) => s.studentTransforms);
  const select = useClassroomStore((s) => s.select);
  const chairsById = useMemo(() => {
    const d = {};
    items
      .filter((i) => i.type === "chair")
      .forEach((ch) => (d[ch.id] = ch));
    return d;
  }, [items]);
  const waitingRowZ = ROOM.depth / 2 - 1.2;
  let waitingX = -ROOM.width / 2 + 0.8;
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 6, 6]} intensity={1} castShadow />
      <RoomShell />
      {items
        .filter((it) => it.type === "desk" || it.type === "chair")
        .map((it) =>
          it.type === "desk" ? (
            <Desk key={it.id} item={it} onSelect={select} />
          ) : (
            <Chair key={it.id} item={it} onSelect={select} />
          )
        )}
      {students.map((s) => {
        const chair = s.seatId ? chairsById[s.seatId] : null;
        let basePos, baseRot;
        if (chair) {
          basePos = [chair.position[0], AVATAR_Y, chair.position[2] - 0.05];
          baseRot = chair.rotation;
        } else {
          basePos = clampToRoom([waitingX, AVATAR_Y, waitingRowZ]);
          waitingX += 0.8;
          baseRot = FACE_FRONT;
        }
        const override = studentTransforms[s.id] || {};
        const pos = override.position ?? basePos;
        const rot = override.rotation ?? baseRot;
        const speakingText = speakingMap[s.id] || null;
        return (
          <StudentAvatar
            key={s.id}
            student={s}
            position={pos}
            rotation={rot}
            onSelect={select}
            speakingText={speakingText}
            onMoved={onStudentMoved}
          />
        );
      })}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.35}
        scale={18}
        blur={2.5}
        far={4}
      />
    </>
  );
}
/* 
 * HUD CONTROLS
 * Floating UI controls used to manipulate selected objects
 * in the classroom (rotation, facing direction).
 * Appears only when an item or student is selected.
 */
function HUDControls() {
  const selectionId = useClassroomStore((s) => s.selectionId);
  const rotateSelected = useClassroomStore((s) => s.rotateSelected);
  const faceFront = useClassroomStore((s) => s.faceFront);
  if (!selectionId) return null;
  const Btn = ({ children, onClick }) => (
    <button
      onClick={onClick}
      style={{
        fontSize: 18,
        padding: "12px 16px",
        borderRadius: 12,
        background: "#3b82f6",
        color: "#fff",
        border: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        display: "flex",
        gap: 10,
        background: "rgba(255,255,255,0.95)",
        border: "1px solid #ddd",
        borderRadius: 14,
        padding: 10,
        zIndex: 20,
      }}
    >
      <Btn onClick={() => rotateSelected(-SNAP.rotateRad)}>↶ הזזה לשמאל </Btn>
      <Btn onClick={() => rotateSelected(SNAP.rotateRad)}>↷ הזזה לימין </Btn>
      <Btn onClick={faceFront}>קדימה ⬆︎</Btn>
    </div>
  );
}
/*
 * VIRTUAL CLASSROOM CORE
 * Central controller of the simulation lifecycle.
 * Responsibilities:
 * - Initialize socket connection per session
 * - Start / stop lesson simulation
 * - Handle real-time student disruptions
 * - Play student TTS audio
 * - Capture teacher speech and voice features
 * - Persist teacher responses to the backend
 * - Trigger AI-generated session summary at lesson end
 * This component acts as the real-time "engine" of the system.
 */
export default function VirtualClassroomCore({ config, sessionId }) {
  if (!sessionId) {
    console.error("❌ VirtualClassroomCore: missing sessionId prop!");
  }
  // ===== Zustand store actions & selectors =====
  const setLastDisruption = useClassroomStore((s) => s.setLastDisruption);
  const startDisruption = useClassroomStore((s) => s.startDisruption);
  const addTeacherResponse = useClassroomStore((s) => s.addTeacherResponse);
  const lastDisruption = useClassroomStore((s) => s.lastDisruption);
useEffect(() => {
  console.log("🔄 RESET lastDisruption because sessionId changed:", sessionId);
  setLastDisruption(null);
}, [sessionId, setLastDisruption]);
  // ===== Local UI state =====
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const socketRef = useRef(null);
  const [speakingMap, setSpeakingMap] = useState({});
  const bubbleTimers = useRef(new Map());
  const [started, setStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState((config?.duration ?? 5) * 60);
  const timerRef = useRef(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
const behaviorMap = {
  attentive: "קשוב",
  talker: "פטפטן",
  defiant: "מרדן",
  sensitive: "רגיש",
  withdrawn: "מופנם",
  conflicts: "יוצר קונפליקטים",
  sarcastic: "ציני",
  hyperactive: "היפראקטיבי",
  neutral: "ניטרלי",
};
  const { features: voiceFeatures } = useTeacherVoiceAnalysis({
    enabled: started,
  });
  /**
 * Handles finalized teacher speech input.
 * This function is triggered when the speech recognition engine
 * finishes capturing a complete teacher utterance.
 * Responsibilities:
 * - Collect the teacher's spoken text
 * - Attach current voice analysis features (volume, pitch, tone)
 * - Link the response to the most recent student disruption (if exists)
 * - Send the full response payload to the backend for storage and AI feedback
 */
  const handleTeacherFinalUtterance = async (teacherText, meta) => {
    console.log("🗣️ [DEBUG] Teacher final text:", teacherText);
    console.log("📊 [DEBUG] Voice features snapshot:", voiceFeatures);
    console.log("⚡ [DEBUG] lastDisruption:", lastDisruption);
    console.log("🧾 [DEBUG] SR meta:", meta);
    const payload = {
      sessionId, 
      teacherText,
      voiceFeatures: {
        volume: voiceFeatures.volume,
        pitch: voiceFeatures.pitch,
        tone: voiceFeatures.tone,
      },
      disruption: lastDisruption || null,
    };
    console.log("📤 [DEBUG] Sending teacher response to server:", payload);
    try {
      const res = await axiosInstance.post(
        "/feedback/teacher-response",
        payload,
        { withCredentials: true }
      );
      console.log("✅ [DEBUG] Server response:", res.data);
      addTeacherResponse(res.data);
    } catch (err) {
      console.error("❌ [DEBUG] Error saving teacher response:", err);
    }
  };
  useTeacherSpeechRecognition({
    enabled: started,
    language: "he-IL",
    onFinalUtterance: handleTeacherFinalUtterance,
  });
  const navigate = useNavigate();
/* 
 * REAL-TIME SOCKET EVENTS
 * Listens for disruption events from the backend AI engine.
 * For each disruption:
 * - Update classroom state
 * - Display speech bubble above the student
 * - Play student voice via TTS
 * - Track the disruption as context for the teacher's next response
 */
  useEffect(() => {
    if (!sessionId) return;
    const socket = createSocket(sessionId);
    socketRef.current = socket;
  socket.on("disruption", async (payload) => {
  console.log("📢 GOT DISRUPTION:", payload);
  startDisruption({
    id: payload.disruptionId,
    sessionId,
    studentId: payload.studentId,
    studentName: payload.studentName,
    type: payload.type,
    label: payload.label || payload.utteranceText,
    utteranceText: payload.utteranceText,
    ts: payload.ts,
    eventId: payload.eventId || null,
  });
  setSpeakingMap((prev) => ({
    ...prev,
    [payload.studentId]: payload.utteranceText,
  }));
  setLastDisruption({
    disruptionId: payload.disruptionId,
    studentId: payload.studentId,
    studentName: payload.studentName,
    type: payload.type,
    label: payload.label,
    utteranceText: payload.utteranceText,
    ts: payload.ts,
    eventId: payload.eventId || null, 
  });
      const state = useClassroomStore.getState();
      const student = state.students.find(
        (s) => s.id === payload.studentId
      );
      if (student) {
        playTTSAudio({
          text: payload.utteranceText,
          gender: student.gender || "M",
          studentId: payload.studentId,
          behaviorProfile: student.behaviorProfile,
        });
      }
      if (bubbleTimers.current.has(payload.studentId)) {
        clearTimeout(bubbleTimers.current.get(payload.studentId));
      }
      bubbleTimers.current.set(
        payload.studentId,
        setTimeout(() => {
          setSpeakingMap((prev) => {
            const next = { ...prev };
            delete next[payload.studentId];
            return next;
          });
          bubbleTimers.current.delete(payload.studentId);
        }, 4000)
      );
    });
    return () => {
      clearInterval(timerRef.current);
      try {
        socket.emit("rec:stop", {});
        socket.emit("lesson:stop");
      } catch (e) {}
      socket.disconnect();
      bubbleTimers.current.forEach((t) => clearTimeout(t));
      bubbleTimers.current.clear();
    };
  }, [sessionId, startDisruption, setLastDisruption]);
  /**
 * 
 * LESSON LIFECYCLE
 * Controls simulation timing and transitions:
 * - Start lesson (mic access, socket start, timer)
 * - Stop lesson (cleanup, summary generation)
 * - Navigate back to main page with session feedback
 */
  const handleStart = async () => {
    if (!socketRef.current) return;
    const students = useClassroomStore.getState().students;
    socketRef.current.emit("lesson:students", {
      students,
      lessonTopic: config?.lessonTopic || "",
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      console.log("🎤 Mic stream acquired for teacher:", stream);
      setIsRecording(true);
    } catch (err) {
      console.warn("Microphone error:", err);
      setIsRecording(false);
    }
    const durationSec = (config?.duration ?? 5) * 60;
    socketRef.current.emit("lesson:start", { durationSec, sessionId });
    setTimeLeft(durationSec);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
      socketRef.current?.emit("lesson:stop", { sessionId });
      handleStop();
          setStarted(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    setStarted(true);
  };
  const handleStop = async () => {
  if (socketRef.current) {
    socketRef.current.emit("lesson:stop", { sessionId });
 socketRef.current.disconnect();
    socketRef.current.off("disruption");
    socketRef.current.off("student:moved");
    window.speechSynthesis?.cancel();
  }
  clearInterval(timerRef.current);
  setStarted(false);
  setIsRecording(false);
  console.log("📌 Generating summary for session:", sessionId);
  try {
    const res = await axiosInstance.post("/summary/generate", { sessionId });
    console.log("📘 SUMMARY GENERATED:", res.data);
    navigate("/MainPage", { state: { summary: res.data.summary } });
  } catch (err) {
    console.error("❌ Summary generation failed:", err);
  }
};
  //JSX 
  return (
    <div className="vc-container">
      {/* ===== TOP BAR ===== */}
      <div className={`vc-header ${started ? "active" : "inactive"}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleStart}
            disabled={started}
            className={`vc-start-btn ${started ? "disabled" : "enabled"}`}
          >
            התחלת סימולציה
          </button>
          <span>{started ? "● הקלטה פעילה (סימולציה)" : "לא פעיל"}</span>
        </div>
        <button onClick={handleStop} className="vc-stop-btn">
          ⛔ סיום
        </button>
        <div className="vc-class-box">
      <span>כיתה:</span>
          <span>{config?.className}</span>
          <span style={{ marginLeft: "15px" }}>🧠נושא:</span>
          <span>{config?.lessonTopic || "—"}</span>
        </div>
        <div>
         זמן ⏱ :{" "}
          {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
          {String(timeLeft % 60).padStart(2, "0")}
        </div>
    <div>{isRecording ? "🎤 מיקרופון פעיל" : "🔇 מיקרופון כבוי"}</div>
        <button
          className="vc-hamburger"
          onClick={() => setIsSidebarOpen(true)}
        >
          ☰
        </button>
      </div>
      {/* ===== MAIN CANVAS ===== */}
      <Canvas shadows camera={{ position: [0, 5.8, -7.2], fov: 50 }}>
        <Scene
          speakingMap={speakingMap}
          onStudentMoved={(id, pos) =>
            socketRef.current?.emit("student:moved", {
              id,
              position: pos,
            })
          }
        />
      </Canvas>
      <HUDControls />
      {/* ===== SIDEBAR ===== */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <button
          className="close-btn"
          onClick={() => setIsSidebarOpen(false)}
        >
          ×
        </button>
    <h2>📘 פרטי הכיתה</h2>
        <p>
          <strong>שם הכיתה :</strong> {config?.className}
        </p>
        <p>
          <strong>נושא השיעור :</strong> {config?.lessonTopic}</p>
        <p>
          <strong>משך השיעור :</strong> {config?.duration} min
        </p>
        <p>
          <strong>סה"כ תלמידים :</strong> {config?.classSize}
        </p>
        <hr />
    <h3>👩‍🏫 תלמידים בכיתה:</h3>
        <ul>
          {useClassroomStore.getState().students.map((s) => (
            <li key={s.id}>
  <strong>{s.name}</strong> – {behaviorMap[s.behaviorProfile] || s.behaviorProfile}
</li>
          ))}
        </ul>
        <hr />
      </div>
      {isSidebarOpen && (
        <div
          className="overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}