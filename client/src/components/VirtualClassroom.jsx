// client/src/components/VirtualClassroom.jsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useClassroomConfig } from "../hooks/useClassroomConfig";
import VirtualClassroomCore from "./VirtualClassroomCore";

export default function VirtualClassroom() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "basic"; // ברירת מחדל

  // טוען את ההגדרות (custom מה-DB או basic ברירת מחדל)
  const { config, loading } = useClassroomConfig(type);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "20vh",
          fontSize: "20px",
          color: "#555",
        }}
      >
        Loading classroom...
      </div>
    );
  }

  if (!config) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "20vh",
          fontSize: "20px",
          color: "#a00",
        }}
      >
        No classroom configuration found.
      </div>
    );
  }

  return <VirtualClassroomCore config={config} />;
}
