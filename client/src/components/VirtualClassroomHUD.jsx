// client/src/components/VirtualClassroomHUD.jsx
import React from "react";
import { useClassroomStore, SNAP } from "../lib/store";

export default function VirtualClassroomHUD() {
  const selectionId = useClassroomStore((s) => s.selectionId);
  const rotateSelected = useClassroomStore((s) => s.rotateSelected);
  const faceFront = useClassroomStore((s) => s.faceFront);

  if (!selectionId) return null;

  return (
    <div className="vc-hud">
      <button
        className="vc-hud-btn"
        onClick={() => rotateSelected(-SNAP.rotateRad)}
      >
        ↶ Rotate Left
      </button>

      <button
        className="vc-hud-btn"
        onClick={() => rotateSelected(SNAP.rotateRad)}
      >
        ↷ Rotate Right
      </button>

      <button className="vc-hud-btn" onClick={faceFront}>
        Face Forward ⬆︎
      </button>
    </div>
  );
}
