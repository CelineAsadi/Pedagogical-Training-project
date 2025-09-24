import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { TransformControls, Html, RoundedBox } from "@react-three/drei";

import "../style/VirtualClassroom.css";

/**
 * Fullscreen classroom with EASY controls:
 * - Click an item → on-object gizmo (move arrows + rotate ⟲/⟳ + reset)
 * - Drag to move freely (Translate only) – no need for keyboard
 * - Double-click item = quick 90° rotate
 * - Camera auto-fits content so nothing gets cut
 */

const DEFAULT_CLASS = {
  numStudents: 32,
  distribution: {
    attention: 7,
    talkers: 5,
    defiant: 4,
    sensitive: 3,
    withdrawn: 2,
    conflicts: 3,
    sarcastic: 2,
    hyperactive: 2,
    neutral: 4,
  },
};

// Room (for walls/floor)
const ROOM = { width: 28, depth: 36, wallHeight: 3.2 };
const HALF_W = ROOM.width / 2;
const HALF_D = ROOM.depth / 2;

const CLOTH_COLORS = ["#1f6feb", "#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];
const SKIN_COLORS  = ["#f3c7a6", "#e8b48f", "#d8a07f", "#c98e70", "#b97f62", "#a86f55"];
const HAIR_COLORS  = ["#2b2b2b", "#3d2b1f", "#5b4636", "#7a5230", "#1f2937"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function buildStudentList(distribution) {
  const list = [];
  Object.values(distribution).forEach((cnt) => { for (let i = 0; i < cnt; i++) list.push(1); });
  return list;
}

/* ---------- Hair ---------- */
function Hair({ style = "short", color = "#2b2b2b" }) {
  switch (style) {
    case "afro":
      return (
        <group position={[0, 0.68, 0]}>
          <mesh position={[0, 0.05, 0]}><sphereGeometry args={[0.22, 24, 24]} /><meshStandardMaterial color={color} /></mesh>
        </group>
      );
    case "bun":
      return (
        <group position={[0, 0.7, -0.05]}>
          <mesh><sphereGeometry args={[0.12, 20, 20]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0, -0.08, 0.04]}><boxGeometry args={[0.42, 0.18, 0.3]} /><meshStandardMaterial color={color} /></mesh>
        </group>
      );
    case "long":
      return (
        <group position={[0, 0.65, 0]}>
          <mesh position={[0, 0.02, -0.05]}><boxGeometry args={[0.48, 0.28, 0.35]} /><meshStandardMaterial color={color} /></mesh>
        </group>
      );
    default:
      return (
        <group position={[0, 0.65, 0]}>
          <mesh><boxGeometry args={[0.45, 0.18, 0.4]} /><meshStandardMaterial color={color} /></mesh>
        </group>
      );
  }
}

/* ---------- Student (male/female) ---------- */
function StudentShape({ name, gender = "male" }) {
  const cloth = useMemo(() => pick(CLOTH_COLORS), []);
  const skin  = useMemo(() => pick(SKIN_COLORS), []);
  const hairColor = useMemo(() => pick(HAIR_COLORS), []);
  const hairStyle = useMemo(() => pick(gender === "female" ? ["long","bun","short","afro"] : ["short","afro","long"]), [gender]);

  const torsoW = gender === "female" ? 0.42 : 0.45;
  const torsoH = 0.6, torsoD = 0.24;

  return (
    <group>
      {/* Head */}
      <mesh position={[0, 0.59, 0]}><sphereGeometry args={[0.25, 32, 32]} /><meshStandardMaterial color={skin} /></mesh>
      <Hair style={hairStyle} color={hairColor} />
      {/* Ears */}
      <mesh position={[-0.22, 0.56, 0]}><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color={skin} /></mesh>
      <mesh position={[0.22, 0.56, 0]}><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color={skin} /></mesh>
      {/* Eyes/pupils */}
      <mesh position={[-0.08, 0.63, 0.23]}><sphereGeometry args={[0.04, 16, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[0.08, 0.63, 0.23]}><sphereGeometry args={[0.04, 16, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[-0.08, 0.63, 0.26]}><sphereGeometry args={[0.02, 16, 16]} /><meshStandardMaterial color="#111827" /></mesh>
      <mesh position={[0.08, 0.63, 0.26]}><sphereGeometry args={[0.02, 16, 16]} /><meshStandardMaterial color="#111827" /></mesh>
      {/* Brows/Mouth */}
      <mesh position={[-0.08, 0.67, 0.24]}><boxGeometry args={[0.08, 0.01, 0.02]} /><meshStandardMaterial color={hairColor} /></mesh>
      <mesh position={[0.08, 0.67, 0.24]}><boxGeometry args={[0.08, 0.01, 0.02]} /><meshStandardMaterial color={hairColor} /></mesh>
      <mesh position={[0, 0.57, 0.24]}><boxGeometry args={[0.09, 0.02, 0.02]} /><meshStandardMaterial color="#d97706" /></mesh>
      {/* Torso/Arms */}
      <RoundedBox position={[0, 0, 0]} args={[torsoW, torsoH, torsoD]} radius={0.06} smoothness={4}><meshStandardMaterial color={cloth} /></RoundedBox>
      <RoundedBox position={[-0.35, 0.1, 0]} args={[0.1, 0.45, 0.1]} radius={0.04} smoothness={3}><meshStandardMaterial color={cloth} /></RoundedBox>
      <RoundedBox position={[0.35, 0.1, 0]} args={[0.1, 0.45, 0.1]} radius={0.04} smoothness={3}><meshStandardMaterial color={cloth} /></RoundedBox>
      {/* Optional subtle skirt */}
      {gender === "female" && (
        <RoundedBox position={[0, -0.18, 0.06]} args={[0.48, 0.2, 0.28]} radius={0.05} smoothness={3}><meshStandardMaterial color={cloth} /></RoundedBox>
      )}
      {/* Notebook */}
      <RoundedBox position={[0.45, 0.05, 0]} args={[0.15, 0.25, 0.02]} radius={0.01} smoothness={3}><meshStandardMaterial color="#facc15" /></RoundedBox>
      {/* Legs */}
      <RoundedBox position={[-0.1, -0.45, 0]} args={[0.15, 0.3, 0.15]} radius={0.04} smoothness={3}><meshStandardMaterial color="#111827" /></RoundedBox>
      <RoundedBox position={[0.1, -0.45, 0]} args={[0.15, 0.3, 0.15]} radius={0.04} smoothness={3}><meshStandardMaterial color="#111827" /></RoundedBox>
      {/* Label */}
      <Html distanceFactor={10} position={[0, 1.05, 0]}><div className="student-label">{name}</div></Html>
    </group>
  );
}

/* ---------- Chair ---------- */
function Chair() {
  return (
    <group position={[0, -0.25, 0]}>
      <RoundedBox position={[-0.15, 0.15, -0.15]} args={[0.1, 0.5, 0.1]} radius={0.02}><meshStandardMaterial color="#4b5563" /></RoundedBox>
      <RoundedBox position={[0.15, 0.15, -0.15]} args={[0.1, 0.5, 0.1]} radius={0.02}><meshStandardMaterial color="#4b5563" /></RoundedBox>
      <RoundedBox position={[-0.15, 0.15, 0.15]} args={[0.1, 0.5, 0.1]} radius={0.02}><meshStandardMaterial color="#4b5563" /></RoundedBox>
      <RoundedBox position={[0.15, 0.15, 0.15]} args={[0.1, 0.5, 0.1]} radius={0.02}><meshStandardMaterial color="#4b5563" /></RoundedBox>
      <RoundedBox position={[0, 0.35, 0]} args={[0.5, 0.1, 0.5]} radius={0.04}><meshStandardMaterial color="#9aa3ae" /></RoundedBox>
      <RoundedBox position={[0, 0.65, -0.2]} args={[0.5, 0.6, 0.1]} radius={0.04}><meshStandardMaterial color="#9aa3ae" /></RoundedBox>
    </group>
  );
}

/* ---------- Desk ---------- */
function DeskModel() {
  return (
    <group>
      <RoundedBox args={[1.6, 0.1, 0.9]} radius={0.05}><meshStandardMaterial color="#c99867" /></RoundedBox>
      <RoundedBox position={[0, -0.18, 0]} args={[1.5, 0.3, 0.8]} radius={0.04}><meshStandardMaterial color="#d9b28a" /></RoundedBox>
      <RoundedBox position={[-0.7, -0.4, -0.35]} args={[0.12, 0.5, 0.12]} radius={0.03}><meshStandardMaterial color="#9aa3ae" /></RoundedBox>
      <RoundedBox position={[0.7, -0.4, -0.35]} args={[0.12, 0.5, 0.12]} radius={0.03}><meshStandardMaterial color="#9aa3ae" /></RoundedBox>
      <RoundedBox position={[-0.7, -0.4, 0.35]} args={[0.12, 0.5, 0.12]} radius={0.03}><meshStandardMaterial color="#9aa3ae" /></RoundedBox>
      <RoundedBox position={[0.7, -0.4, 0.35]} args={[0.12, 0.5, 0.12]} radius={0.03}><meshStandardMaterial color="#9aa3ae" /></RoundedBox>
    </group>
  );
}

/* ---------- Room: walls + floor ---------- */
function RoomShell() {
  const y = ROOM.wallHeight / 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#efe9dc" />
      </mesh>
      <mesh position={[0, y, -HALF_D + 0.04]}><boxGeometry args={[ROOM.width, ROOM.wallHeight, 0.08]} /><meshStandardMaterial color="#f3e8d2" /></mesh>
      <mesh position={[-HALF_W + 0.04, y, 0]}><boxGeometry args={[0.08, ROOM.wallHeight, ROOM.depth]} /><meshStandardMaterial color="#f3e8d2" /></mesh>
      <mesh position={[HALF_W - 0.04, y, 0]}><boxGeometry args={[0.08, ROOM.wallHeight, ROOM.depth]} /><meshStandardMaterial color="#f3e8d2" /></mesh>
    </group>
  );
}

/* ---------- Back-wall decor ---------- */
function BackWallDecor() {
  const z = -HALF_D + 0.06;
  return (
    <group>
      <group position={[-HALF_W + 1.2, 1.0, z + 0.15]}>
        <RoundedBox args={[1.2, 2.0, 0.3]} radius={0.05}><meshStandardMaterial color="#8b5e3c" /></RoundedBox>
        {new Array(4).fill(0).map((_, i) => (
          <mesh key={i} position={[0, -0.8 + i * 0.5, 0.16]}><boxGeometry args={[1.1, 0.08, 0.28]} /><meshStandardMaterial color="#754c2a" /></mesh>
        ))}
        {new Array(12).fill(0).map((_, i) => (
          <mesh key={`b${i}`} position={[-0.5 + (i % 6) * 0.2, -0.68 + Math.floor(i / 6) * 0.5, 0.18]}>
            <boxGeometry args={[0.08, 0.32, 0.1]} /><meshStandardMaterial color={pick(["#ef4444","#10b981","#3b82f6","#f59e0b","#eab308"])} />
          </mesh>
        ))}
      </group>
      {[-2.5,0,2.5].map((x,i)=>(
        <group key={i} position={[x, 2.0, z + 0.12]}>
          <RoundedBox args={[1.0, 1.2, 0.02]} radius={0.03}><meshStandardMaterial color="#1f2937" /></RoundedBox>
          <RoundedBox position={[0,0,0.02]} args={[0.9,1.1,0.01]} radius={0.02}><meshStandardMaterial color={pick(["#93c5fd","#a7f3d0","#fde68a"])} /></RoundedBox>
        </group>
      ))}
      <group position={[HALF_W - 2.0, 2.4, z + 0.12]}>
        <mesh><circleGeometry args={[0.45, 32]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh rotation={[0,0,Math.PI/2]}><boxGeometry args={[0.02, 0.35, 0.02]} /><meshStandardMaterial color="#111827" /></mesh>
        <mesh><boxGeometry args={[0.02, 0.25, 0.02]} /><meshStandardMaterial color="#111827" /></mesh>
      </group>
      <group position={[HALF_W - 3.0, 1.8, z + 0.12]}>
        <RoundedBox args={[2.0, 1.2, 0.05]} radius={0.03}><meshStandardMaterial color="#e5e7eb" /></RoundedBox>
        <RoundedBox position={[0,0,0.03]} args={[1.8,1.0,0.02]} radius={0.02}><meshStandardMaterial color="#93c5fd" /></RoundedBox>
      </group>
    </group>
  );
}

/* ---------- utils ---------- */
const INNER_MARGIN = 0.8;
const SNAP = 0.1;
function clampToRoom([x, y, z]) {
  const minX = -HALF_W + INNER_MARGIN, maxX = HALF_W - INNER_MARGIN;
  const minZ = -HALF_D + INNER_MARGIN, maxZ = HALF_D - INNER_MARGIN;
  return [Math.min(maxX, Math.max(minX, x)), y, Math.min(maxZ, Math.max(minZ, z))];
}
const snap = (v, s) => Math.round(v / s) * s;

/* ---------- Movable with EASY gizmo ---------- */
function Movable({ id, selectedId, setSelectedId, initialPosition, children, onCommit }) {
  const ref = useRef();
  const selected = selectedId === id;
  const [pos, setPos] = useState(() => clampToRoom(initialPosition));
  useEffect(() => { if (ref.current) ref.current.position.set(...pos); }, [pos]);

  const MOVE_STEP = 0.25;
  const ROT_STEP = Math.PI / 12; // 15°

  const nudge = (dx, dz) => {
    if (!ref.current) return;
    const nx = ref.current.position.x + dx;
    const nz = ref.current.position.z + dz;
    const clamped = clampToRoom([nx, initialPosition[1], nz]);
    ref.current.position.set(...clamped);
    setPos(clamped);
    onCommit?.(id, { x: clamped[0], z: clamped[2] });
  };
  const rotate = (dir) => {
    if (!ref.current) return;
    ref.current.rotation.y = snap(ref.current.rotation.y + dir * ROT_STEP, ROT_STEP);
    onCommit?.(id, { x: ref.current.position.x, z: ref.current.position.z });
  };
  const resetRot = () => {
    if (!ref.current) return;
    ref.current.rotation.y = 0;
    onCommit?.(id, { x: ref.current.position.x, z: ref.current.position.z });
  };

  return (
    <>
      <group
        ref={ref}
        onPointerDown={(e) => { e.stopPropagation(); setSelectedId(id); }}
        onDoubleClick={(e) => { e.stopPropagation(); rotate(+6); /* 6*15° = 90° */ }}
      >
        {children}
      </group>

      {/* Drag to move (translate only) */}
      {selected && (
        <TransformControls
          object={ref.current}
          mode="translate"
          showX showZ
          showY={false}
          translationSnap={SNAP}
          onMouseDown={(e) => e?.stopPropagation?.()}
          onChange={() => { if (ref.current) ref.current.position.y = initialPosition[1]; }}
          onMouseUp={() => {
            if (!ref.current) return;
            const { x, z } = ref.current.position;
            const clamped = clampToRoom([x, initialPosition[1], z]);
            ref.current.position.set(...clamped);
            setPos(clamped);
            onCommit?.(id, { x: clamped[0], z: clamped[2] });
          }}
        />
      )}

      {/* EASY gizmo buttons (Html overlay) */}
      {selected && (
        <Html position={[0, 1.1, 0]} distanceFactor={8} transform>
          <div className="vc-gizmo" onPointerDown={(e)=>e.stopPropagation()}>
            <button className="vc-gizmo__btn" onClick={()=>nudge(0, -MOVE_STEP)}>↑</button>
            <div className="vc-gizmo__rot">
              <button className="vc-gizmo__btn" onClick={()=>rotate(-1)}>⟲</button>
              <button className="vc-gizmo__btn" onClick={()=>resetRot()}>↺</button>
              <button className="vc-gizmo__btn" onClick={()=>rotate(+1)}>⟳</button>
            </div>
            <div className="vc-gizmo__row">
              <button className="vc-gizmo__btn" onClick={()=>nudge(-MOVE_STEP, 0)}>←</button>
              <button className="vc-gizmo__btn" onClick={()=>nudge(0, +MOVE_STEP)}>↓</button>
              <button className="vc-gizmo__btn" onClick={()=>nudge(+MOVE_STEP, 0)}>→</button>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

/* ---------- Adaptive camera that fits the CONTENT ---------- */
function AdaptiveCameraFit({ targets, padding = 2, fitKey = 0 }) {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!targets || targets.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const t of targets) {
      minX = Math.min(minX, t.x); maxX = Math.max(maxX, t.x);
      minZ = Math.min(minZ, t.z); maxZ = Math.max(maxZ, t.z);
    }
    const deskW = 1.6, deskD = 0.9;
    const width = (maxX - minX) + deskW + padding * 2;
    const depth = (maxZ - minZ) + deskD + padding * 2;
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

    const vFOV = (camera.fov * Math.PI) / 180;
    const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * camera.aspect);
    const distV = (depth / 2) / Math.tan(vFOV / 2);
    const distH = (width  / 2) / Math.tan(hFOV / 2);
    const dist = Math.max(distV, distH);

    camera.position.set(cx, dist * 0.6, cz + dist);
    camera.near = 0.1; camera.far = 2000; camera.updateProjectionMatrix();
    camera.lookAt(cx, 0, cz);
  }, [targets, padding, fitKey, camera, size.width, size.height]);
  return null;
}

/* ---------- Scene ---------- */
function ClassroomScene({ numStudents, distribution, onAnyCommit, fitKey }) {
  const cols = 8;
  const rows = Math.ceil(numStudents / cols);
  const dx = 2.5, dz = 2.5;
  const startX = -((cols - 1) * dx) / 2;
  const startZ = -((rows - 1) * dz) / 2 + 2;

  const studentTypes = useMemo(() => buildStudentList(distribution), [distribution]);

  const seats = useMemo(() => {
    const out = [];
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx >= numStudents) break;
        out.push({
          x: startX + c * dx,
          z: startZ + r * dz,
          name: `S${idx + 1}`,
          gender: (r + c) % 2 === 0 ? "male" : "female",
          type: studentTypes[idx],
        });
        idx++;
      }
    }
    return out;
  }, [rows, cols, dx, dz, startX, startZ, numStudents, studentTypes]);

  const deskPositionsRef = useRef(seats.map(s => ({ x: s.x, z: s.z })));
  const updateDeskPos = () => onAnyCommit?.();

  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <AdaptiveCameraFit targets={deskPositionsRef.current} padding={2} fitKey={fitKey} />

      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 10, 8]} intensity={0.7} />

      <RoomShell />
      <BackWallDecor />

      {/* transparent floor to clear selection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} onPointerDown={() => setSelectedId(null)} visible={false}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {seats.map((s, i) => {
        const base = [s.x, 0, s.z];
        // keep the tracked desk positions in sync from the desk object only
        const onCommit = (id, pos) => {
          if (id.startsWith("desk-")) deskPositionsRef.current[i] = { x: pos.x, z: pos.z };
          updateDeskPos();
        };
        return (
          <group key={i}>
            <Movable id={`desk-${i}`}    selectedId={selectedId} setSelectedId={setSelectedId} initialPosition={[base[0], -0.2,  base[2]]} onCommit={onCommit}><DeskModel /></Movable>
            <Movable id={`chair-${i}`}   selectedId={selectedId} setSelectedId={setSelectedId} initialPosition={[base[0], -0.65, base[2]-0.6]} onCommit={onCommit}><Chair /></Movable>
            <Movable id={`student-${i}`} selectedId={selectedId} setSelectedId={setSelectedId} initialPosition={[base[0], 0,     base[2]+0.1]} onCommit={onCommit}><StudentShape name={s.name} gender={s.gender} /></Movable>
          </group>
        );
      })}
    </>
  );
}

export default function VirtualClassroomFull() {
  const [settings] = useState(DEFAULT_CLASS);
  const [fitKey, setFitKey] = useState(0);

  return (
    <div className="vc-fullscreen">
      <Canvas camera={{ position: [0, 9, 16], fov: 50 }}>
        <ClassroomScene
          numStudents={settings.numStudents}
          distribution={settings.distribution}
          fitKey={fitKey}
          onAnyCommit={() => setFitKey((x) => x + 1)}  // re-fit after any move/rotate
        />
      </Canvas>

      <div className="vc-help">לחץ על אובייקט → חיצים להזזה · ⟲/⟳ לסיבוב · ↺ לאיפוס · דאבל-קליק = סיבוב 90°</div>
    </div>
  );
}
