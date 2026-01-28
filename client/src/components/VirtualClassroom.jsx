/**
 * VirtualClassroom Page
 * This file serves as the entry point for the virtual classroom experience.
 * It is responsible for:
 * - Reading URL query parameters (sessionId, classroom type)
 * - Loading the appropriate classroom configuration via a custom hook
 * - Handling loading and error states before the simulation starts
 * - Passing validated data to the core classroom renderer
 * This component acts as a thin orchestration layer and intentionally
 * contains no classroom logic or rendering details.
 */
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