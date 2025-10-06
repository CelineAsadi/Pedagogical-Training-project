import { create } from 'zustand';
import { nanoid } from 'nanoid';

export const ROOM = { width: 14, depth: 10 };
export const SNAP = { translate: 0.25, rotateRad: Math.PI / 12 };
export const FACE_FRONT = [0, Math.PI, 0];
export const NUM_STUDENTS = 15;

function buildBehaviorList() {
  const weighted = [
    'attention','attention','attention',
    'talker','talker',
    'defiant','defiant',
    'sensitive','sensitive',
    'withdrawn','withdrawn',
    'conflicts',
    'sarcastic',
    'hyperactive',
    'neutral'
  ];
  const out = [];
  for (let i=0; i<NUM_STUDENTS; i++) out.push(weighted[i % weighted.length]);
  return out.slice(0, NUM_STUDENTS);
}

function buildClassItems() {
  const items = [];
  const ROWS = 4, SEATS_PER_ROW = 4;
  const DESK_SPACING_X = 2.0, DESK_SPACING_Z = 2.2;
  const SIDE_AISLE = 1.0;
  const FRONT_CLEARANCE = 1.8;

  const totalWidth = SIDE_AISLE + SEATS_PER_ROW * DESK_SPACING_X + SIDE_AISLE;
  const START_X = -totalWidth/2 + SIDE_AISLE + DESK_SPACING_X/2;
  const START_Z = -ROOM.depth/2 + FRONT_CLEARANCE;

  for (let r=0; r<ROWS; r++) {
    for (let i=0; i<SEATS_PER_ROW; i++) {
      const x = START_X + i*DESK_SPACING_X;
      const z = START_Z + r*DESK_SPACING_Z;
      items.push({ id: nanoid(), type:'desk',  position:[x,0,z],       rotation: FACE_FRONT });
      items.push({ id: nanoid(), type:'chair', position:[x,0,z+0.75], rotation: FACE_FRONT });
    }
  }
  return items;
}

const makeStudents = (behaviorList, chairs) => {
  const students = [];
  const genders = ['M','F'];
  for (let i=0; i<behaviorList.length; i++) {
    students.push({
      id: nanoid(),
      name: `Student ${i+1}`,
      gender: genders[Math.floor(Math.random()*genders.length)],
      behaviorProfile: behaviorList[i],
      seatId: chairs[i]?.id ?? null,
    });
  }
  return students;
};

const initialItems = buildClassItems();
const initialChairs = initialItems.filter(i => i.type==='chair');
const behaviorList = buildBehaviorList();
const initialStudents = makeStudents(behaviorList, initialChairs);

export const useClassroomStore = create((set, get) => ({
  items: initialItems,
  students: initialStudents,

  selectionId: null,
  select: (id) => set({ selectionId: id }),

  moveItem: (id, position, rotation) => set(state => ({
    items: state.items.map(it => it.id === id ? { ...it, position, rotation: rotation ?? it.rotation } : it)
  })),

  studentTransforms: {},
  moveStudent: (id, position, rotation) => set(state => ({
    studentTransforms: {
      ...state.studentTransforms,
      [id]: { position, rotation: rotation ?? (state.studentTransforms[id]?.rotation ?? FACE_FRONT) }
    }
  })),

  rotateSelected: (dirRad) => set(state => {
    const id = state.selectionId;
    if (!id) return {};
    const isItem = state.items.some(it => it.id === id);
    if (isItem) {
      return {
        items: state.items.map(it =>
          it.id !== id ? it : { ...it, rotation: [it.rotation[0], it.rotation[1] + dirRad, it.rotation[2]] }
        )
      };
    } else {
      const st = state.studentTransforms[id] ?? {};
      const rot = st.rotation ?? FACE_FRONT;
      return {
        studentTransforms: {
          ...state.studentTransforms,
          [id]: { position: st.position ?? [0,0.85,0], rotation: [rot[0], rot[1] + dirRad, rot[2] ?? 0] }
        }
      };
    }
  }),

  faceFront: () => set(state => {
    const id = state.selectionId;
    if (!id) return {};
    const isItem = state.items.some(it => it.id === id);
    if (isItem) {
      return { items: state.items.map(it => it.id !== id ? it : { ...it, rotation: FACE_FRONT }) };
    } else {
      const st = state.studentTransforms[id] ?? {};
      return {
        studentTransforms: {
          ...state.studentTransforms,
          [id]: { position: st.position ?? [0,0.85,0], rotation: FACE_FRONT }
        }
      };
    }
  }),

  // ===== אירועי שיעור בזיכרון =====
  disruptions: [],        // [{disruptionId, studentId, text, ts}]
  teacherResponses: [],   // [{disruptionId, text, ts, latencyMs}]

  addDisruption: (d) => set((s) => ({ disruptions: [...s.disruptions, d] })),
  addTeacherResponse: (r) => set((s) => ({ teacherResponses: [...s.teacherResponses, r] })),

  // לתצוגה של בועה/פה:
  lastDisruption: null,
  setLastDisruption: (d) => set({ lastDisruption: d }),
}));
