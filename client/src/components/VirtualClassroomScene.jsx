// client/src/components/VirtualClassroomScene.jsx
import React, { useMemo } from "react";
import { ContactShadows } from "@react-three/drei";
import StudentAvatar from "./StudentAvatar";
import { useClassroomStore, ROOM, FACE_FRONT } from "../lib/store";
import { clampToRoom } from "../lib/drag";

const AVATAR_Y = 0.55;

/* ===== Room Shell ===== */
function RoomShell() {
  const w = ROOM.width,
    d = ROOM.depth,
    h = 3;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#e7e7e7" />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#fafafa" />
      </mesh>

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

  return (
    <group
      position={item.position}
      rotation={item.rotation}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.id);
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

  return (
    <group
      position={item.position}
      rotation={item.rotation}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.id);
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

/* ===== Scene ===== */
export default function VirtualClassroomScene({ speakingMap, onStudentMoved }) {
  const items = useClassroomStore((s) => s.items);
  const students = useClassroomStore((s) => s.students);
  const transforms = useClassroomStore((s) => s.studentTransforms);
  const select = useClassroomStore((s) => s.select);

  const chairsById = useMemo(() => {
    const d = {};
    items.filter((i) => i.type === "chair").forEach((c) => (d[c.id] = c));
    return d;
  }, [items]);

  const waitingRowZ = ROOM.depth / 2 - 1.2;
  let waitingX = -ROOM.width / 2 + 0.8;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 6, 6]} intensity={1} castShadow />

      <RoomShell />

      {items.map((it) =>
        it.type === "desk" ? (
          <Desk key={it.id} item={it} onSelect={select} />
        ) : (
          <Chair key={it.id} item={it} onSelect={select} />
        )
      )}

      {students.map((s) => {
        const chair = s.seatId ? chairsById[s.seatId] : null;
        let basePos = chair
          ? [chair.position[0], AVATAR_Y, chair.position[2] - 0.05]
          : clampToRoom([waitingX, AVATAR_Y, waitingRowZ]);

        if (!chair) waitingX += 0.8;

        const override = transforms[s.id] || {};
        const pos = override.position ?? basePos;
        const rot = override.rotation ?? (chair?.rotation || FACE_FRONT);

        return (
          <StudentAvatar
            key={s.id}
            student={s}
            position={pos}
            rotation={rot}
            onSelect={select}
            speakingText={speakingMap[s.id]}
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
