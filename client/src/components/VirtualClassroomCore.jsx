// client/src/components/VirtualClassroomCore.jsx
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import "../style/VirtualClassroomCore.css";

import { useClassroomStore, ROOM, SNAP, FACE_FRONT } from '../lib/store';
import { useDragOnFloor, snapVec3, clampToRoom } from '../lib/drag';
import { createSocket } from '../lib/socket';
import StudentAvatar from './StudentAvatar';

const AVATAR_Y = 0.55;

/* ===== RoomShell ===== */
function RoomShell() {
  const w = ROOM.width, d = ROOM.depth, h = 3;
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
    onDrag: (p) => moveItem(item.id, snapVec3(clampToRoom([p.x, 0, p.z])), item.rotation),
  });
  return (
    <group
      position={item.position}
      rotation={item.rotation}
      onPointerDown={(e) => { e.stopPropagation(); onSelect(item.id); startDrag(e); }}
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
    onDrag: (p) => moveItem(item.id, snapVec3(clampToRoom([p.x, 0, p.z])), item.rotation),
  });
  return (
    <group
      position={item.position}
      rotation={item.rotation}
      onPointerDown={(e) => { e.stopPropagation(); onSelect(item.id); startDrag(e); }}
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

/* ===== Scene ===== */
function Scene({ speakingMap, onStudentMoved }) {
  const items = useClassroomStore((s) => s.items);
  const students = useClassroomStore((s) => s.students);
  const studentTransforms = useClassroomStore((s) => s.studentTransforms);
  const select = useClassroomStore((s) => s.select);

  const chairsById = useMemo(() => {
    const d = {};
    items.filter(i => i.type === 'chair').forEach(ch => d[ch.id] = ch);
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
        .filter(it => it.type === 'desk' || it.type === 'chair')
        .map(it =>
          it.type === 'desk'
            ? <Desk key={it.id} item={it} onSelect={select} />
            : <Chair key={it.id} item={it} onSelect={select} />
        )}

      {students.map((s) => {
        // בסיס לפי כיסא/שורת המתנה
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

        // override חלקי בלבד (אם יש) — לא לרוקן position כשמגיע רק rotation
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

      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={18} blur={2.5} far={4} />
    </>
  );
}

/* ===== HUD ===== */
function HUDControls() {
  const selectionId = useClassroomStore(s => s.selectionId);
  const items = useClassroomStore(s => s.items);
  const moveItem = useClassroomStore(s => s.moveItem);
  const moveStudent = useClassroomStore(s => s.moveStudent);
  const rotateSelected = useClassroomStore(s => s.rotateSelected);
  const faceFront = useClassroomStore(s => s.faceFront);

  if (!selectionId) return null;

  const step = SNAP.translate;
  const isItem = items.some(it => it.id === selectionId);

 

  const Btn = ({ children, onClick }) => (
    <button
      onClick={onClick}
      style={{
        fontSize: 18, padding: '12px 16px', borderRadius: 12,
        background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer'
      }}
    >{children}</button>
  );

  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 16, transform: 'translateX(-50%)',
      display: 'flex', gap: 10, background: 'rgba(255,255,255,0.95)',
      border: '1px solid #ddd', borderRadius: 14, padding: 10, zIndex: 20
    }}>
      <Btn onClick={() => rotateSelected(-SNAP.rotateRad)}>↶ סובב</Btn>
      <Btn onClick={() => rotateSelected(SNAP.rotateRad)}>↷ סובב</Btn>
      <Btn onClick={faceFront}>יישור קדימה ⬆︎</Btn>
    </div>
  );
  
}
/* ===== Main Core ===== */
export default function VirtualClassroomCore({ config }) {
  const setLastDisruption = useClassroomStore(s => s.setLastDisruption);
  const addDisruption = useClassroomStore(s => s.addDisruption);
  const addTeacherResponse = useClassroomStore(s => s.addTeacherResponse);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sessionId = useRef(crypto.randomUUID()).current;
  const socketRef = useRef(null);
  const [speakingMap, setSpeakingMap] = useState({});
  const bubbleTimers = useRef(new Map());
  const [started, setStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState((config?.duration ?? 5) * 60);

  const timerRef = useRef(null);

  useEffect(() => {
    const socket = createSocket(sessionId);
    socketRef.current = socket;

    socket.on('disruption', (payload) => {
      addDisruption?.({
        disruptionId: payload.disruptionId,
        studentId: payload.studentId,
        text: payload.utteranceText,
        ts: payload.ts
      });

      setSpeakingMap(prev => ({ ...prev, [payload.studentId]: payload.utteranceText }));
      setLastDisruption({ studentId: payload.studentId, utteranceText: payload.utteranceText, timestamp: Date.now() });

      if (bubbleTimers.current.has(payload.studentId)) clearTimeout(bubbleTimers.current.get(payload.studentId));
      bubbleTimers.current.set(payload.studentId, setTimeout(() => {
        setSpeakingMap(prev => {
          const next = { ...prev }; delete next[payload.studentId]; return next;
        });
        bubbleTimers.current.delete(payload.studentId);
      }, 3000));
    });

    return () => {
      clearInterval(timerRef.current);
      socket.emit('rec:stop', {});
      socket.disconnect();
      bubbleTimers.current.forEach(t => clearTimeout(t));
      bubbleTimers.current.clear();
    };
  }, [sessionId, addDisruption, setLastDisruption]);

  const handleStart = async () => {
    if (!socketRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone error:', err);
      setIsRecording(false);
    }
    socketRef.current.emit('lesson:start', { durationSec: (config?.duration ?? 5) * 60 });
    setTimeLeft((config?.duration ?? 5) * 60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          socketRef.current?.emit('lesson:stop');
          clearInterval(timerRef.current);
          setStarted(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    setStarted(true);
  };

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
          START
        </button>
        <span>{started ? "● Recording (Simulation)" : "Inactive"}</span>
      </div>

      {/* Stop Button */}
      <button
        onClick={() => {
          socketRef.current?.emit("lesson:stop");
          clearInterval(timerRef.current);
          setStarted(false);
        }}
        className="vc-stop-btn"
      >
        ⛔ END
      </button>

      {/* Class Name */}
      <div className="vc-class-box">
        <span>Class:</span>
        <span>{config?.className}</span>
      </div>

      {/* Time */}
      <div>
        TIME ⏱ :{" "}
        {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
        {String(timeLeft % 60).padStart(2, "0")}
      </div>

      {/* Mic Status */}
      <div>{isRecording ? "🎤 Mic Active" : "🔇 Mic Off"}</div>

      {/* === Hamburger Menu (3 lines) === */}
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
          socketRef.current?.emit("student:moved", { id, position: pos })
        }
      />
    </Canvas>

    <HUDControls />

    {/* ===== SIDEBAR (CLASS DETAILS) ===== */}
    <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
        ×
      </button>
      <h2>📘 Class Details</h2>
      <p><strong>Name:</strong> {config?.className}</p>
      <p><strong>Duration:</strong> {config?.duration} min</p>
      <p><strong>Total Students:</strong> {config?.classSize}</p>

      <hr />

      <h3>👥 Student Types:</h3>
      <ul>
        {config?.studentTypes?.map((s, i) => (
          <li key={i}>{s.name} – {s.count}</li>
        ))}
      </ul>
    </div>

    {/* Overlay */}
    {isSidebarOpen && (
      <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>
    )}
  </div>
);
}
