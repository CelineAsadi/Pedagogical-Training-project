import { create } from "zustand";
import { nanoid } from "nanoid";
// Classroom spatial constants
export const ROOM = { width: 14, depth: 10 };
export const SNAP = { translate: 0.25, rotateRad: Math.PI / 12 };
export const FACE_FRONT = [0, Math.PI, 0];
const AVATAR_Y = 0.55; 
/**
 * Helper: derive a student's base pose
 * A student's "base pose" comes from their assigned chair.
 * Used when:
 * - rotating students
 * - resetting orientation
 * - no manual drag override exists
 */
function getStudentBasePose(state, studentId) {
  const stu = state.students.find((x) => x.id === studentId);
  if (!stu || !stu.seatId) return { basePos: undefined, baseRot: undefined };
  const chair = state.items.find(
    (it) => it.id === stu.seatId && it.type === "chair"
  );
  if (!chair) return { basePos: undefined, baseRot: undefined };
  const basePos = [chair.position[0], AVATAR_Y, chair.position[2] - 0.05];
  const baseRot = chair.rotation;
  return { basePos, baseRot };
}
/**
 * Helper: normalize rotation angle
 * Keeps yaw values within [-π, π]
 * Prevents numeric drift during rotations
 */
function normYaw(rad) {
  let r = rad;
  while (r <= -Math.PI) r += Math.PI * 2;
  while (r > Math.PI) r -= Math.PI * 2;
  return r;
}
/**
 * Classroom furniture generator
 * Builds desks + chairs layout programmatically
 * Ensures:
 * - consistent spacing
 * - aligned rows
 * - fixed number of seats
 */
function buildClassItems() {
  const items = [];
  const ROWS = 4;
  const SEATS_PER_ROW = 4;
  const DESK_SPACING_X = 2.0;
  const DESK_SPACING_Z = 2.2;
  const SIDE_AISLE = 1.0;
  const FRONT_CLEARANCE = 1.8;
  const totalWidth = SIDE_AISLE + SEATS_PER_ROW * DESK_SPACING_X + SIDE_AISLE;
  const START_X = -totalWidth / 2 + SIDE_AISLE + DESK_SPACING_X / 2;
  const START_Z = -ROOM.depth / 2 + FRONT_CLEARANCE;
  for (let r = 0; r < ROWS; r++) {
    for (let i = 0; i < SEATS_PER_ROW; i++) {
      const x = START_X + i * DESK_SPACING_X;
      const z = START_Z + r * DESK_SPACING_Z;
      items.push({
        id: nanoid(),
        type: "desk",
        position: [x, 0, z],
        rotation: FACE_FRONT,
      });
      items.push({
        id: nanoid(),
        type: "chair",
        position: [x, 0, z + 0.75],
        rotation: FACE_FRONT,
      });
    }
  }
  return items;
}
const initialItems = buildClassItems();
/**
 *  Zustand Classroom Store
 * Central state manager for:
 * - classroom layout
 * - student positioning
 * - selection & interaction
 * - disruptions & teacher responses
 *
 * Used by:
 * - VirtualClassroomCore
 * - StudentAvatar
 * - HUD controls
 * - Socket event handlers
 */
export const useClassroomStore = create((set, get) => ({
  // Static classroom objects
  items: initialItems,
  // Students & selection
  students: [],
  selectionId: null,
  select: (id) => set({ selectionId: id }),
  //Furniture movement
  moveItem: (id, position, rotation) =>
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id
          ? { ...it, position, rotation: rotation ?? it.rotation }
          : it
      ),
    })),
      // Student transforms (overrides)
  studentTransforms: {},
  moveStudent: (id, position, rotation) =>
    set((state) => ({
      studentTransforms: {
        ...state.studentTransforms,
        [id]: {
          position,
          rotation:
            rotation ??
            (state.studentTransforms[id]?.rotation ?? FACE_FRONT),
        },
      },
    })),
    //  Rotation controls (HUD)
  rotateSelected: (dirRad) =>
    set((state) => {
      const id = state.selectionId;
      if (!id) return {};
      const isItem = state.items.some((it) => it.id === id);
      if (isItem) {
        return {
          items: state.items.map((it) =>
            it.id === id
              ? {
                  ...it,
                  rotation: [
                    it.rotation[0],
                    normYaw(it.rotation[1] + dirRad),
                    it.rotation[2],
                  ],
                }
              : it
          ),
        };
      }
      const prev = state.studentTransforms[id] ?? {};
      const { basePos, baseRot } = getStudentBasePose(state, id);
      const currentPos = prev.position ?? basePos;
      const currentRot = prev.rotation ?? baseRot ?? FACE_FRONT;
      const nextRot = [
        currentRot[0],
        normYaw(currentRot[1] + dirRad),
        currentRot[2] ?? 0,
      ];
      return {
        studentTransforms: {
          ...state.studentTransforms,
          [id]: {
            position: currentPos, 
            rotation: nextRot,
          },
        },
      };
    }),
  faceFront: () =>
    set((state) => {
      const id = state.selectionId;
      if (!id) return {};
      const isItem = state.items.some((it) => it.id === id);
      if (isItem) {
        return {
          items: state.items.map((it) =>
            it.id === id ? { ...it, rotation: FACE_FRONT } : it
          ),
        };
      }
      const prev = state.studentTransforms[id] ?? {};
      const { basePos } = getStudentBasePose(state, id);
      const currentPos = prev.position ?? basePos;
      return {
        studentTransforms: {
          ...state.studentTransforms,
          [id]: {
            position: currentPos,
            rotation: FACE_FRONT,
          },
        },
      };
    }),
    // Disruptions lifecycle
  disruptions: [],
  teacherResponses: [],
  lastDisruption: null,
  startDisruption: ({
    id,
    sessionId,
    studentId,
    studentName,
    type,
    label,
    utteranceText,
    ts, 
  }) =>
    set((state) => {
      const startedAt = ts || Date.now();
      const disruption = {
        id: id || nanoid(),
        sessionId: sessionId || null,
        studentId,
        studentName: studentName || null,
        type: type || "unknown",
        label: label || utteranceText || "Disruption",
        utteranceText: utteranceText || "",
        startedAt,
        endedAt: null,
      };
      return {
        disruptions: [...state.disruptions, disruption],
        lastDisruption: {
          studentId: studentId,
          disruptionId: disruption.id,
          utteranceText: disruption.utteranceText,
          timestamp: startedAt,
        },
      };
    }),
  endDisruption: (disruptionId) =>
    set((state) => ({
      disruptions: state.disruptions.map((d) =>
        d.id === disruptionId && !d.endedAt
          ? { ...d, endedAt: Date.now() }
          : d
      ),
    })),
  clearDisruptions: () => set({ disruptions: [], lastDisruption: null }),
  //Teacher responses
  addTeacherResponse: (response) =>
    set((state) => ({
      teacherResponses: [...state.teacherResponses, response],
    })),
  setLastDisruption: (d) => set({ lastDisruption: d }),
}));