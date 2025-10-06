// client/src/components/VirtualClassroom.jsx
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';

import { useClassroomStore, ROOM, SNAP, FACE_FRONT } from '../lib/store';
import { useDragOnFloor, snapVec3, clampToRoom } from '../lib/drag';
import { createSocket } from '../lib/socket';
import StudentAvatar from './StudentAvatar';

// גובה ישיבה של האווטארים על הכיסא
const AVATAR_Y = 0.55;

/* ===== RoomShell – no front wall ===== */
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
      {/* Back wall */}
      <mesh position={[0, h / 2, d / 2]}>
        <boxGeometry args={[w, h, 0.08]} />
        <meshStandardMaterial color="#d9d9d9" />
      </mesh>
      {/* Left wall */}
      <mesh position={[-w / 2, h / 2, 0]}>
        <boxGeometry args={[0.08, h, d]} />
        <meshStandardMaterial color="#d9d9d9" />
      </mesh>
      {/* Right wall */}
      <mesh position={[w / 2, h / 2, 0]}>
        <boxGeometry args={[0.08, h, d]} />
        <meshStandardMaterial color="#d9d9d9" />
      </mesh>
    </group>
  );
}

/* ===== Desk / Chair ===== */
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
      {/* seat */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#A0AEC0" />
      </mesh>
      {/* back stick */}
      <mesh position={[0, 0.45, -0.2]} castShadow>
        <boxGeometry args={[0.05, 0.9, 0.05]} />
        <meshStandardMaterial color="#4A5568" />
      </mesh>
      {/* back panel */}
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
        )
      }

      {students.map(s => {
        const override = studentTransforms[s.id];
        let pos, rot;
        if (override) {
          pos = override.position;
          rot = override.rotation ?? FACE_FRONT;
        } else {
          const chair = s.seatId ? chairsById[s.seatId] : null;
          if (chair) {
            // מושיבים על הכיסא, מעט קרוב יותר לשולחן
            pos = [chair.position[0], AVATAR_Y, chair.position[2] - 0.05];
            rot = chair.rotation;
          } else {
            pos = clampToRoom([waitingX, AVATAR_Y, waitingRowZ]);
            waitingX += 0.8;
            rot = FACE_FRONT;
          }
        }

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

  const nudge = (dx, dz) => {
    if (isItem) {
      const it = items.find(i => i.id === selectionId);
      if (!it) return;
      const [x, y, z] = it.position;
      const next = snapVec3(clampToRoom([x + dx, y, z + dz]));
      moveItem(it.id, [next[0], 0, next[2]], it.rotation);
    } else {
      const st = useClassroomStore.getState().studentTransforms[selectionId];
      const cur = st?.position ?? [0, AVATAR_Y, 0];
      const next = snapVec3(clampToRoom([cur[0] + dx, AVATAR_Y, cur[2] + dz]));
      moveStudent(selectionId, next, st?.rotation ?? FACE_FRONT);
      document.dispatchEvent(new CustomEvent('studentMovedFromHUD', { detail: { id: selectionId, position: next } }));
    }
  };

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
      <Btn onClick={() => nudge(-step, 0)}>⬅︎ שמאלה</Btn>
      <Btn onClick={() => nudge(step, 0)}>ימינה ➡︎</Btn>
      <Btn onClick={() => nudge(0, -step)}>⬆︎ קדימה</Btn>
      <Btn onClick={() => nudge(0, step)}>אחורה ⬇︎</Btn>
      <Btn onClick={() => rotateSelected(-SNAP.rotateRad)}>↶ סובב</Btn>
      <Btn onClick={() => rotateSelected(SNAP.rotateRad)}>↷ סובב</Btn>
      <Btn onClick={faceFront}>יישור קדימה ⬆︎</Btn>
    </div>
  );
}

/* ===== Main ===== */
export default function VirtualClassroom() {
  const setLastDisruption = useClassroomStore(s => s.setLastDisruption);
  const addDisruption = useClassroomStore(s => s.addDisruption);
  const addTeacherResponse = useClassroomStore(s => s.addTeacherResponse);
  const disruptions = useClassroomStore(s => s.disruptions);

  const sessionId = useRef(crypto.randomUUID()).current;
  const socketRef = useRef(null);

  // speakingMap: studentId -> text (נעלם אחרי ~3 שניות) כדי לאפשר כמה בועות יחד
  const [speakingMap, setSpeakingMap] = useState({});
  const bubbleTimers = useRef(new Map());

  // START control + recording + timer
  const [started, setStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const timerRef = useRef(null);

  // MediaRecorder + Web Speech (אם זמין)
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);

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

      if (bubbleTimers.current.has(payload.studentId)) {
        clearTimeout(bubbleTimers.current.get(payload.studentId));
      }
      bubbleTimers.current.set(payload.studentId, setTimeout(() => {
        setSpeakingMap(prev => {
          const next = { ...prev }; delete next[payload.studentId]; return next;
        });
        bubbleTimers.current.delete(payload.studentId);
      }, 3000));

      const u = new SpeechSynthesisUtterance(payload.utteranceText);
      u.lang = 'he-IL';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });

    // שליחת מצב כיתה ראשוני
    function initClassOnServer() {
      const { items, students, studentTransforms } = useClassroomStore.getState();
      const chairsById = {};
      items.filter(i => i.type === 'chair').forEach(ch => chairsById[ch.id] = ch);

      const payload = students.map(s => {
        const ov = studentTransforms[s.id];
        let pos;
        if (ov?.position) pos = ov.position;
        else if (s.seatId && chairsById[s.seatId]) {
          const ch = chairsById[s.seatId];
          pos = [ch.position[0], AVATAR_Y, ch.position[2] - 0.05];
        } else {
          pos = [0, AVATAR_Y, ROOM.depth/2 - 1.2];
        }
        return { id: s.id, name: s.name, behaviorProfile: s.behaviorProfile, position: pos };
      });

      socket.emit('class:init', { students: payload });
    }
    initClassOnServer();

    const onHudMove = (e) => {
      const { id, position } = e.detail || {};
      if (id && position) socket.emit('student:moved', { id, position });
    };
    document.addEventListener('studentMovedFromHUD', onHudMove);

    return () => {
      document.removeEventListener('studentMovedFromHUD', onHudMove);
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
      mr.ondataavailable = () => {};
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone permission denied or not available:', err);
      setIsRecording(false);
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'he-IL';
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            const text = e.results[i][0].transcript.trim();
            if (!text) continue;
            const pending = findPendingDisruption(useClassroomStore.getState().disruptions);
            if (pending) {
              const payload = { disruptionId: pending.disruptionId, text, ts: Date.now() };
              socketRef.current?.emit('teacher:response', payload);
              if (typeof addTeacherResponse === 'function') {
                const latencyMs = payload.ts - pending.ts;
                addTeacherResponse({ ...payload, latencyMs });
              }
            }
          }
        }
      };
      try { rec.start(); recognitionRef.current = rec; } catch (e) {}
    } else {
      console.warn('SpeechRecognition not supported; responses will not be transcribed.');
    }

    socketRef.current.emit('lesson:start', { durationSec: 5 * 60 });
    socketRef.current.emit('rec:start', { durationSec: 5 * 60 });

    setTimeLeft(5 * 60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          socketRef.current?.emit('lesson:stop');
          socketRef.current?.emit('rec:stop');
          try { mediaRecorderRef.current?.stop(); } catch {}
          try { recognitionRef.current?.stop(); } catch {}
          clearInterval(timerRef.current);
          setIsRecording(false);
          setStarted(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    setStarted(true);
  };

  function findPendingDisruption(disruptionsList) {
    const now = Date.now();
    const windowMs = 90_000;
    const candidates = (disruptionsList || [])
      .filter(d => now - d.ts < windowMs)
      .sort((a,b)=> b.ts - a.ts);
    return candidates[0] || null;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff' }}>
      {/* Top bar */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:48,
        background: started ? '#fee2e2' : '#f3f4f6',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 12px', fontSize:14, zIndex:40, borderBottom:'1px solid #e5e7eb'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <button
            onClick={handleStart}
            disabled={started}
            style={{
              padding:'8px 14px', borderRadius:10, border:'none',
              background: started ? '#9ca3af' : '#16a34a', color:'#fff', cursor: started ? 'not-allowed':'pointer',
              fontWeight:600
            }}>
            START
          </button>
          <span>{started ? '● מקליט (סימולציה)' : 'לא פעיל'}</span>
        </div>
        <div>זמן נותר: {String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}</div>
        <div>{isRecording ? 'מיקרופון מופעל' : 'מיקרופון כבוי/לא זמין'}</div>
      </div>

      <Canvas shadows camera={{ position: [0, 5.8, -7.2], fov: 50 }}>
        <Scene speakingMap={speakingMap} onStudentMoved={(id, pos)=>socketRef.current?.emit('student:moved', { id, position: pos })} />
      </Canvas>

      <HUDControls />
    </div>
  );
}
