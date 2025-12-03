import React, { useEffect, useState } from "react";
import "../style/SummaryPopup.css";
import { mainPageStore } from "../store/mainPageStore";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SummaryPopup({ summary, onClose }) {
  const [graphData, setGraphData] = useState([]);
  const { fetchLastThree } = mainPageStore();

  useEffect(() => {
    const loadGraph = async () => {
  try {
    const result = await fetchLastThree(summary.sessionId);

    if (!result.sessions) {
      console.error("No sessions returned from server");
      return;
    }

    const graph = result.sessions.map((s) => ({
      name: s.className,
      score: s.score ?? 0,
    }));

    setGraphData(graph);
  } catch (err) {
    console.error("Failed to load last 3 sessions graph", err);
  }
};


    loadGraph();
  }, [summary]);

  if (!summary) return null;

  return (
    <div className="summary-overlay">
      <div className="summary-window">

        <button className="summary-close" onClick={onClose}>×</button>

        <h2 className="summary-title">📘 Session Summary</h2>

        {/* ==== SUMMARY FIELDS ==== */}
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

        {/* ==== GRAPH ===== */}
        <div className="summary-section">
  <h3>📊 Progress (latest + 2 previous)</h3>

  <div className="graph-container">
    <ResponsiveContainer>
      <BarChart data={graphData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#cfd7e6" />
        <XAxis 
          dataKey="name"
          angle={-20}
          textAnchor="end"
          interval={0}
          height={45}
          stroke="#2d4f8b"
        />
        <YAxis stroke="#2d4f8b" />
        <Tooltip />
        <Bar dataKey="score" fill="#4e8cff" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>


      </div>
    </div>
  );
}
