// client/src/components/VirtualClassroom.jsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useClassroomConfig } from "../hooks/useClassroomConfig";
import VirtualClassroomCore from "./VirtualClassroomCore";

import "../style/VirtualClassroom.css";

export default function VirtualClassroom() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "basic";
  const sessionId = searchParams.get("sessionId");

  const { config, loading } = useClassroomConfig(type);

  if (loading) {
    return (
      <div className="vc-loading">Loading classroom...</div>
    );
  }

  if (!config) {
    return (
      <div className="vc-error">No classroom configuration found.</div>
    );
  }

  return (
    <VirtualClassroomCore
      config={config}
      sessionId={sessionId}
    />
  );
}
