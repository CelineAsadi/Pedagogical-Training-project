import React, { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls, Html } from "@react-three/drei";
import "../style/VirtualClassroom.css";

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

const CLOTH_COLORS = ["#3b82f6", "#ef4444", "#facc15", "#10b981", "#8b5cf6", "#f97316", "#6366f1"];

function buildStudentList(distribution) {
  const list = [];
  Object.entries(distribution).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) list.push(type);
  });
  return list;
}

function getRandomColor() {
  return CLOTH_COLORS[Math.floor(Math.random() * CLOTH_COLORS.length)];
}

// --- דמות תלמיד משודרגת עם מחברת ---
function StudentShape({ name }) {
  const clothColor = useMemo(() => getRandomColor(), []);

  return (
    <group>
      {/* ראש */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#fcd5b5" />
      </mesh>

      {/* גוף */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.2]} />
        <meshStandardMaterial color={clothColor} />
      </mesh>

      {/* ידיים */}
      <mesh position={[-0.35, 0.1, 0]}>
        <boxGeometry args={[0.1, 0.45, 0.1]} />
        <meshStandardMaterial color={clothColor} />
      </mesh>
      <mesh position={[0.35, 0.1, 0]}>
        <boxGeometry args={[0.1, 0.45, 0.1]} />
        <meshStandardMaterial color={clothColor} />
      </mesh>

      {/* מחברת ביד ימין */}
      <mesh position={[0.45, 0.05, 0]}>
        <boxGeometry args={[0.15, 0.25, 0.02]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>

      {/* רגליים */}
      <mesh position={[-0.1, -0.45, 0]}>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0.1, -0.45, 0]}>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      {/* תווית שם */}
      <Html distanceFactor={10} position={[0, 0.9, 0]}>
        <div className="student-label">{name}</div>
      </Html>
    </group>
  );
}

// --- כיסא ---
function Chair() {
  return (
    <group position={[0, -0.25, 0]}>
      {/* רגליים */}
      <mesh position={[-0.15, 0.15, -0.15]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      <mesh position={[0.15, 0.15, -0.15]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      <mesh position={[-0.15, 0.15, 0.15]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      <mesh position={[0.15, 0.15, 0.15]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>

      {/* מושב */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* גב הכיסא */}
      <mesh position={[0, 0.65, -0.2]}>
        <boxGeometry args={[0.5, 0.6, 0.1]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
    </group>
  );
}

// --- שולחן ---
function DeskModel() {
  return (
    <mesh>
      <boxGeometry args={[1.6, 0.2, 0.9]} />
      <meshStandardMaterial color="#9ca3af" />
    </mesh>
  );
}

// --- קומפוננטה ניתנת להזזה ---
function Movable({ children, position }) {
  const [selected, setSelected] = useState(false);
  return (
    <>
      <group
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          setSelected((s) => !s);
        }}
      >
        {children}
      </group>
      {selected && (
        <TransformControls mode="translate">
          <group>{children}</group>
        </TransformControls>
      )}
    </>
  );
}

// --- סצנה של הכיתה ---
function ClassroomScene({ numStudents, distribution }) {
  const studentTypes = useMemo(() => buildStudentList(distribution), [distribution]);
  const cols = 8;
  const rows = Math.ceil(numStudents / cols);
  const items = [];
  let idx = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= numStudents) break;
      const x = (c - (cols / 2 - 0.5)) * 2.5;
      const z = (r - (rows / 2 - 0.5)) * 2.5;
      items.push({ x, z, name: `S${idx + 1}` });
      idx++;
    }
  }

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />

      {/* רצפה */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>

      {/* שולחנות + כיסאות + תלמידים */}
      {items.map((it, i) => (
        <group key={i} position={[it.x, 0, it.z]}>
          <Movable position={[0, -0.2, 0]}>
            <DeskModel />
          </Movable>
          <Movable position={[0, -0.65, 0]}>
            <Chair />
          </Movable>
          <Movable position={[0, 0, 0]}>
            <StudentShape name={it.name} />
          </Movable>
        </group>
      ))}

      {/* מצלמה קבועה */}
      <OrbitControls enableRotate={false} enableZoom={false} enablePan={false} />
    </>
  );
}

// --- רכיב ראשי ---
export default function VirtualClassroom() {
  const [settings] = useState(DEFAULT_CLASS);

  return (
    <div className="virtual-container">
      <div className="virtual-canvas">
        <Canvas camera={{ position: [0, 6, 10], fov: 50 }}>
          <ClassroomScene
            numStudents={settings.numStudents}
            distribution={settings.distribution}
          />
        </Canvas>
      </div>

      <aside className="virtual-panel">
        <h2>כיתה סטנדרטית</h2>
        <div>סטודנטים: {settings.numStudents}</div>
        <div className="virtual-types-title">סוגי הפרעות:</div>
        <ul className="virtual-types-list">
          {Object.entries(settings.distribution).map(([type, count]) => (
            <li key={type}>
              {type} — {count}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
