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

        <h2 className="summary-title">📘 סיכום השיעור</h2>

        {/* ==== SUMMARY FIELDS ==== */}
        <div className="summary-section">
          <h3>🔢  ממוצעים</h3>
          <p><strong>ממוצע כללי:</strong> {summary.overallAvg ?? "—"}</p>
          <p><strong>ממוצע תזמון תגובה:</strong> {summary.timingAvg ?? "—"}</p>
          <p><strong>ממוצע טון דיבור:</strong> {summary.toneAvg ?? "—"}</p>
          <p><strong>ממוצע פדגוגיה:</strong> {summary.pedagogyAvg ?? "—"}</p>
          <p><strong>זמן תגובה ממוצע:</strong> {summary.avgResponseTime ?? "—"} שנייה</p>
        </div>

        <div className="summary-section">
          <h3>💪 נקודות חוזקה</h3>
          <p>{summary.strength || "—"}</p>
        </div>

        <div className="summary-section">
          <h3>⚠ נקודות לשיפור</h3>
          <p>{summary.weakness || "—"}</p>
        </div>

        {/* ==== GRAPH ===== */}
        <div className="summary-section">
  <h3>( השיעור הזה  + שני קודמים )📊 התקדמות </h3>

  <div className="graph-container">
    <ResponsiveContainer width="100%" aspect={2.5}>
      <BarChart data={graphData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#cfd7e6" />
         <XAxis
        dataKey="name"
        label={{
          value: "שם כיתה",
          position: "insideBottom",
          offset: -5,
          fill: "#2d4f8b",
        }}
        angle={-20}
        textAnchor="end"
        interval={0}
        height={45}
        stroke="#2d4f8b"
      />

      {/* ---- ציר Y: ציון ---- */}
      <YAxis
        label={{
          value: "ציון",
          angle: -90,
          position: "insideLeft",
          fill: "#2d4f8b",
          dx: 10
        }}
        stroke="#2d4f8b"
      />

       <Tooltip
        formatter={(value, name) => [`${value}`, "ציון"]}
        labelFormatter={(label) => `כיתה: ${label}`}
      />
        <Bar dataKey="score" fill="#4e8cff" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>


      </div>
    </div>
  );
}
