import React from "react";
import "../style/SummaryPopup.css";

export default function SummaryPopup({ summary, onClose }) {
  if (!summary) return null;

  return (
    <div className="summary-overlay">
      <div className="summary-window">
        
        <button className="summary-close" onClick={onClose}>×</button>

        <h2 className="summary-title">📘 Session Summary</h2>

        <div className="summary-section">
          <h3>🔢 Averages</h3>
          <p><strong>Overall Average:</strong> {summary.overallAvg ?? "—"}</p>
          <p><strong>Timing Average:</strong> {summary.timingAvg ?? "—"}</p>
          <p><strong>Tone Average:</strong> {summary.toneAvg ?? "—"}</p>
          <p><strong>Pedagogy Average:</strong> {summary.pedagogyAvg ?? "—"}</p>
          <p><strong>Avg Response Time:</strong> {summary.avgResponseTime ?? "—"} sec</p>
        </div>

        <div className="summary-section">
          <h3>💪 Strengths</h3>
          <p>{summary.strength || "—"}</p>
        </div>

        <div className="summary-section">
          <h3>⚠ Weaknesses</h3>
          <p>{summary.weakness || "—"}</p>
        </div>

      </div>
    </div>
  );
}