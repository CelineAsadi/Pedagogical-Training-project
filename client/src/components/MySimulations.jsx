import React from "react";
import "../style/MySimulations.css";
import { Link } from "react-router-dom";
import { authStore } from "../store/authStore";
import { useEffect, useState } from "react";
import { mainPageStore } from "../store/mainPageStore";
import SummaryPopup from "./SummaryPopup";

export default function MySimulations() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedSummary, setSelectedSummary] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const { logout } = authStore();
  const { fetchUser, fetchUserClasses, fetchClassSummaries } = mainPageStore();

  // LOAD FIRST PAGE
  useEffect(() => {
    const load = async () => {
      const u = await fetchUser();
      setUser(u);

      const res = await fetchUserClasses(1, 5);

      // Enrich classes with latest summary score
      const enriched = await Promise.all(
        res.classes.map(async (cls) => {
          const summaryData = await fetchClassSummaries(cls._id);

          let score = "—";
          if (summaryData.sessions) {
            const latest = summaryData.sessions[0];
            if (latest.summary) score = latest.summary.overallAvg;
          }

          return { ...cls, score };
        })
      );

      setClasses(enriched);
      setHasMore(res.hasMore);
    };

    load();
  }, []);

  const loadMore = async () => {
    if (!hasMore) return;

    const nextPage = page + 1;
    const res = await fetchUserClasses(nextPage, 5);

    if (!res.classes) {
      setHasMore(false);
      return;
    }

    // Enrich new batch
    const enriched = await Promise.all(
      res.classes.map(async (cls) => {
        const summaryData = await fetchClassSummaries(cls._id);

        let score = "—";
        if (summaryData.sessions) {
          const latest = summaryData.sessions[0];
          if (latest.summary) score = latest.summary.overallAvg;
        }

        return { ...cls, score };
      })
    );

    setClasses((prev) => [...prev, ...enriched]);
    setPage(nextPage);
    setHasMore(res.hasMore);
  };

  const handleLogout = () => logout();

  const openSummary = async (classId) => {
    const data = await fetchClassSummaries(classId);

    if (!data.sessions || data.sessions.length === 0) {
      alert("No summary available yet.");
      return;
    }

    const latest = data.sessions[0];

    if (!latest.summary) {
      alert("No summary generated yet.");
      return;
    }

    setSelectedSummary(latest.summary);
    setShowPopup(true);
  };

  return (
    <div>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="left-section">
          <div className="logo">
            <img src="/ourLogo.png" alt="Pedagogical Training" />
          </div>
          <div className="username">
            <span className="hello">Hello, </span>
            <span className="name">{user?.LName} {user?.FName}</span>
          </div>
        </div>

        <ul className="nav-links">
          <li><Link to="/MySimulations">My Simulation</Link></li>
          <li><Link to="/Profile">Profile</Link></li>
          <li><button className="logout-btn" onClick={handleLogout}>Logout</button></li>
          <li><Link to="/lang">🌐 ENG</Link></li>
        </ul>
      </nav>

      {/* PAGE CONTENT */}
      <div className="simulation-page-container">
        <h1 className="title">View My Simulations</h1>

        <div className="table-container">
          <div className="table-header">
            <span>Date</span>
            <span>Class</span>
            <span>Total Score</span>
            <span></span>
          </div>

          {classes.map((cls) => (
            <div key={cls._id} className="table-row">
              <span>{new Date(cls.createdAt).toLocaleDateString()}</span>

              <span className="class-name">
                <span className="class-icon">🧑‍🏫</span> {cls.className}
              </span>

              <span>{cls.score ?? "—"}</span>

              <span className="actions">
                <button 
                  className="feedback-btn"
                  onClick={() => openSummary(cls._id)}
                >
                  Feedback
                </button>
              </span>
            </div>
          ))}
        </div>

        {/* LOAD MORE */}
        {hasMore && (
          <div className="load-more-container">
            <button className="load-more-btn" onClick={loadMore}>
              Load More
            </button>
          </div>
        )}

        {!hasMore && classes && (
          <p className="no-more">No more classes.</p>
        )}
      </div>

      {/* Summary Popup */}
      {showPopup && (
        <SummaryPopup 
          summary={selectedSummary} 
          onClose={() => setShowPopup(false)} 
        />
      )}
    </div>
  );
}