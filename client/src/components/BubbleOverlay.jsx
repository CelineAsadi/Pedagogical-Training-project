import React from "react";
import { useClassroomStore } from "../lib/store";

export default function BubbleOverlay({ speakingMap }) {
  const students = useClassroomStore((s) => s.students);
  const studentTransforms = useClassroomStore((s) => s.studentTransforms);

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0,
      width: "100%", height: "100%",
      pointerEvents: "none",
      zIndex: 50,
    }}>
      {students.map((s) => {
        const pos = studentTransforms[s.id]?.screenPos;
        const text = speakingMap[s.id];

        if (!text || !pos) return null;

        return (
          <div key={s.id} style={{
            position: "absolute",
            transform: `translate(-50%, -100%)`,
            left: pos.x,
            top: pos.y,
            background: "#fff8e1",
            border: "1px solid #facc15",
            padding: "6px 8px",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            fontSize: 12,
            maxWidth: 200,
            textAlign: "center"
          }}>
            {text}
          </div>
        );
      })}
    </div>
  );
}
