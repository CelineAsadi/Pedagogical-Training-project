import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { ROOM, SNAP } from './store';

export function clampToRoom([x, y, z]) {
  const margin = 0.4;
  const halfW = ROOM.width / 2 - margin;
  const halfD = ROOM.depth / 2 - margin;
  return [Math.max(-halfW, Math.min(halfW, x)), y, Math.max(-halfD, Math.min(halfD, z))];
}

export function snapVec3([x, y, z]) {
  const s = SNAP.translate;
  return [Math.round(x / s) * s, y, Math.round(z / s) * s];
}

export function useDragOnFloor({ onDrag, onEnd }) {
  const { camera, gl } = useThree();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  function pointFrom(ev) {
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera({ x, y }, camera);
    const p = new THREE.Vector3();
    ray.ray.intersectPlane(plane, p);
    return p;
  }

  function startDrag(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    gl.domElement.style.cursor = 'grabbing';
    const move = (ev) => onDrag?.(pointFrom(ev));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      gl.domElement.style.cursor = 'auto';
      onEnd?.();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  return { startDrag };
}