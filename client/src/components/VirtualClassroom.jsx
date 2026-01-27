// client/src/components/VirtualClassroom.jsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useClassroomConfig } from "../hooks/useClassroomConfig";
import VirtualClassroomCore from "./VirtualClassroomCore";

import "../style/VirtualClassroom.css";

/**
 * VirtualClassroom Component
 * Loads the classroom configuration based on URL parameters
 * and renders the main virtual classroom simulation.
 * Handles loading and error states before initializing
 * the VirtualClassroomCore component.
 */

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