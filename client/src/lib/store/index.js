import { create } from "zustand";
import { nanoid } from "nanoid";

/* ==== קבועים כלליים ==== */
export const ROOM = { width: 14, depth: 10 };
export const SNAP = { translate: 0.25, rotateRad: Math.PI / 12 };
export const FACE_FRONT = [0, Math.PI, 0];
const AVATAR_Y = 0.55; // גובה ישיבה של האבאטארים

/* ==== עזרים פנימיים ==== */
// גזירת תנוחת בסיס (מיקום/סיבוב) לתלמיד לפי הכיסא שלו, אם יש
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

// נירמול זווית ל-(-π, π]
function normYaw(rad) {
  let r = rad;
  while (r <= -Math.PI) r += Math.PI * 2;
  while (r > Math.PI) r -= Math.PI * 2;
  return r;
}

/* ✅ פונקציה שבונה רהיטים (desks + chairs) */
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

// ✅ כיתה בסיסית מוכנה כבר בטעינה
const initialItems = buildClassItems();

/* ==== Zustand Store ==== */
export const useClassroomStore = create((set, get) => ({
  /* פריטים ותלמידים */
  items: initialItems,
  students: [],

  /* בחירה */
  selectionId: null,
  select: (id) => set({ selectionId: id }),

  /* תנועת פריט (שולחן/כיסא) */
  moveItem: (id, position, rotation) =>
    set((state) => ({
      items: state.items.map((it) =>
        it.id === id
          ? { ...it, position, rotation: rotation ?? it.rotation }
          : it
      ),
    })),

  /* טרנספורמים של תלמידים (מיקום/סיבוב חורגים מהבסיס) */
  studentTransforms: {},

  // גרירה/הזזה של תלמיד (שומר גם rotation אם התקבל; אחרת משאיר קיים/ברירת-מחדל קדימה)
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

  /* סיבוב של מה שנבחר (פריט או תלמיד) — בלי "קפיצה" */
  rotateSelected: (dirRad) =>
    set((state) => {
      const id = state.selectionId;
      if (!id) return {};

      // אם זה פריט (שולחן/כיסא)
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

      // תלמיד
      const prev = state.studentTransforms[id] ?? {};
      const { basePos, baseRot } = getStudentBasePose(state, id);

      // תמיד משמרים position: קודם override קיים; אם אין — גוזרים מכיסא; אם גם אין, נשאיר undefined (יטופל ב-Scene)
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
            position: currentPos, // ✅ לא מאפסים ל-[0,0.85,0]
            rotation: nextRot,
          },
        },
      };
    }),

  /* יישור קדימה של מה שנבחר (פריט או תלמיד) — בלי "קפיצה" */
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

      // תלמיד
      const prev = state.studentTransforms[id] ?? {};
      const { basePos } = getStudentBasePose(state, id);

      const currentPos = prev.position ?? basePos; // ✅ משמרים/גוזרים מכיסא
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

  /* ===== אירועי סימולציה ===== */
  disruptions: [],
  teacherResponses: [],
  lastDisruption: null,

  addDisruption: (d) =>
    set((s) => ({ disruptions: [...s.disruptions, d] })),

  addTeacherResponse: (r) =>
    set((s) => ({ teacherResponses: [...s.teacherResponses, r] })),

  setLastDisruption: (d) => set({ lastDisruption: d }),
}));
