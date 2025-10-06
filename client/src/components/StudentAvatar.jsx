// client/src/components/StudentAvatar.js
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { useClassroomStore, FACE_FRONT } from '../lib/store';
import { useDragOnFloor, snapVec3, clampToRoom } from '../lib/drag';

const AVATAR_Y = 0.55; // אותו גובה ישיבה כמו בסצנה

export default function StudentAvatar({ student, position, rotation, onSelect, speakingText, onMoved }) {
  const groupRef = useRef(null);
  const mouthRef = useRef(null);
  const lidsRefL = useRef(null);
  const lidsRefR = useRef(null);
  const moveStudent = useClassroomStore((s) => s.moveStudent);

  const visual = useMemo(() => {
    const skinTones = ['#f2c7a3', '#e0a67c', '#c2845d', '#a36a48', '#7c4f32'];
    const topsB = ['#2563eb', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
    const topsG = ['#ef4444', '#06b6d4', '#16a34a', '#d946ef', '#f59e0b', '#3b82f6'];
    const pantsB = ['#1f2937', '#334155', '#4b5563'];
    const skirts = ['#64748b', '#475569', '#374151'];
    const hairs = ['#2b2b2b', '#3a2a1f', '#1f1f1f', '#754c24', '#5c4033', '#3d2b1f'];

    const isGirl = (student.gender || 'M') === 'F';
    const skin = skinTones[Math.floor(Math.random() * skinTones.length)];
    const top = (isGirl ? topsG : topsB)[Math.floor(Math.random() * (isGirl ? topsG : topsB).length)];
    const bottom = (isGirl ? skirts : pantsB)[Math.floor(Math.random() * (isGirl ? skirts : pantsB).length)];
    const hair = hairs[Math.floor(Math.random() * hairs.length)];
    const height = isGirl ? 1.0 + Math.random() * 0.05 : 1.02 + Math.random() * 0.06;
    const hairStyle = isGirl ? (Math.random() < 0.5 ? 'bob' : 'ponytail') : 'short';
    return { isGirl, skin, top, bottom, hair, hairStyle, height };
  }, [student.id, student.gender]);

  useFrame((state) => {
    const g = groupRef.current; if (!g) return;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, rotation?.[1] ?? FACE_FRONT[1], 0.12);
    g.position.y = position[1] + 0.02 * Math.sin(state.clock.getElapsedTime() * 1.1 + student.id.length);
  });

  const { startDrag } = useDragOnFloor({
    onDrag: (p) => {
      const newPos = snapVec3(clampToRoom([p.x, AVATAR_Y, p.z]));
      moveStudent(student.id, newPos, rotation ?? FACE_FRONT);
      onMoved?.(student.id, newPos);
    },
  });

  useFrame((state) => {
    if (!mouthRef.current) return;
    if (!speakingText) { mouthRef.current.scale.y = 0.03; return; }
    const t = state.clock.getElapsedTime();
    mouthRef.current.scale.y = 0.03 + 0.09 * (0.5 + 0.5 * Math.sin(t * 10));
  });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const blink = (Math.sin(t * 0.6 + student.id.length) + 1) / 2;
    const closeY = blink > 0.96 ? 0.02 : 0.08;
    if (lidsRefL.current) lidsRefL.current.scale.y = closeY;
    if (lidsRefR.current) lidsRefR.current.scale.y = closeY;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[visual.height, visual.height, visual.height]}
      onPointerDown={(e) => { e.stopPropagation(); onSelect(student.id); startDrag(e); }}
    >
      {/* Highlight ring while speaking */}
      {speakingText && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <ringGeometry args={[0.38, 0.54, 48]} />
          <meshBasicMaterial color="#ffb703" />
        </mesh>
      )}

      {/* Lower body */}
      <group position={[0, -0.32, 0]}>
        {visual.isGirl ? (
          <>
            <mesh position={[0, 0.16, 0]} castShadow>
              <coneGeometry args={[0.28, 0.28, 24]} />
              <meshStandardMaterial color={visual.bottom} />
            </mesh>
            <mesh position={[-0.1, -0.02, 0]} castShadow>
              <cylinderGeometry args={[0.05,0.05,0.24,12]} />
              <meshStandardMaterial color={visual.skin} />
            </mesh>
            <mesh position={[0.1, -0.02, 0]} castShadow>
              <cylinderGeometry args={[0.05,0.05,0.24,12]} />
              <meshStandardMaterial color={visual.skin} />
            </mesh>
            <mesh position={[-0.1, -0.16, 0.04]} castShadow>
              <boxGeometry args={[0.12,0.06,0.18]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[0.1, -0.16, 0.04]} castShadow>
              <boxGeometry args={[0.12,0.06,0.18]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
          </>
        ) : (
          <>
            <mesh position={[0, 0.08, 0]} castShadow>
              <boxGeometry args={[0.36, 0.24, 0.28]} />
              <meshStandardMaterial color={visual.bottom} />
            </mesh>
            <mesh position={[-0.08, -0.1, 0]} castShadow>
              <cylinderGeometry args={[0.06,0.06,0.26,12]} />
              <meshStandardMaterial color={visual.bottom} />
            </mesh>
            <mesh position={[0.08, -0.1, 0]} castShadow>
              <cylinderGeometry args={[0.06,0.06,0.26,12]} />
              <meshStandardMaterial color={visual.bottom} />
            </mesh>
            <mesh position={[-0.08, -0.22, 0.05]} castShadow>
              <boxGeometry args={[0.14,0.06,0.2]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[0.08, -0.22, 0.05]} castShadow>
              <boxGeometry args={[0.14,0.06,0.2]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
          </>
        )}
      </group>

      {/* Upper body */}
      <group position={[0, -0.02, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.23, 0.25, 0.44, 18]} />
          <meshStandardMaterial color={visual.top} />
        </mesh>
        <mesh position={[-0.28, -0.05, 0]} rotation={[0,0,Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.04,0.04,0.32,12]} />
          <meshStandardMaterial color={visual.top} />
        </mesh>
        <mesh position={[0.28, -0.05, 0]} rotation={[0,0,Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.04,0.04,0.32,12]} />
          <meshStandardMaterial color={visual.top} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <torusGeometry args={[0.08, 0.015, 12, 24]} />
          <meshStandardMaterial color={visual.top} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 0.23, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 12]} />
        <meshStandardMaterial color={visual.skin} />
      </mesh>

      {/* Head + face */}
      <group position={[0, 0.35, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshStandardMaterial color={visual.skin} />
        </mesh>

        <group position={[0, 0.03, 0.22]}>
          <group position={[-0.08, 0.02, 0]}>
            <mesh><sphereGeometry args={[0.04,16,16]} /><meshStandardMaterial color="#fff" /></mesh>
            <mesh position={[0,0,0.035]}><sphereGeometry args={[0.018,16,16]} /><meshStandardMaterial color="#222" /></mesh>
            <mesh ref={lidsRefL} position={[0,0.015,0.02]}>
              <boxGeometry args={[0.08,0.08,0.01]} />
              <meshStandardMaterial color={visual.skin} />
            </mesh>
          </group>
          <group position={[0.08, 0.02, 0]}>
            <mesh><sphereGeometry args={[0.04,16,16]} /><meshStandardMaterial color="#fff" /></mesh>
            <mesh position={[0,0,0.035]}><sphereGeometry args={[0.018,16,16]} /><meshStandardMaterial color="#222" /></mesh>
            <mesh ref={lidsRefR} position={[0,0.015,0.02]}>
              <boxGeometry args={[0.08,0.08,0.01]} />
              <meshStandardMaterial color={visual.skin} />
            </mesh>
          </group>
        </group>

        <mesh ref={mouthRef} position={[0, -0.07, 0.24]}>
          <boxGeometry args={[0.12, 0.03, 0.02]} />
          <meshStandardMaterial color="#a33b3b" />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 0.02, -0.02]}>
          <sphereGeometry args={[0.265, 32, 32, 0, Math.PI*2, 0, Math.PI/2]} />
          <meshStandardMaterial color={visual.hair} />
        </mesh>
        {visual.hairStyle === 'bob' && (
          <mesh position={[0, -0.04, -0.02]}>
            <torusGeometry args={[0.24, 0.08, 12, 36]} />
            <meshStandardMaterial color={visual.hair} />
          </mesh>
        )}
        {visual.hairStyle === 'ponytail' && (
          <>
            <mesh position={[0, -0.02, -0.18]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color={visual.hair} />
            </mesh>
            <mesh position={[0, -0.1, -0.3]} rotation={[Math.PI/2.6, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.06, 0.28, 12]} />
              <meshStandardMaterial color={visual.hair} />
            </mesh>
          </>
        )}
      </group>

      {/* Label */}
      <Html distanceFactor={10} position={[0, -0.66, 0]} style={{ pointerEvents:'none' }}>
        <div style={{
          background:'rgba(255,255,255,0.95)', padding:'2px 6px',
          borderRadius:6, border:'1px solid #ddd', fontSize:12
        }}>
          {student.name} ({student.behaviorProfile}) · {student.gender === 'F' ? 'girl' : 'boy'}
        </div>
      </Html>

      {/* Speech bubble */}
      {speakingText && (
        <Html distanceFactor={12} position={[0, 0.75, 0.15]}>
          <div style={{
            maxWidth:230, background:'#fff8e1', border:'1px solid #facc15',
            padding:'6px 8px', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.12)', fontSize:12
          }}>
            {speakingText}
          </div>
        </Html>
      )}
    </group>
  );
}
