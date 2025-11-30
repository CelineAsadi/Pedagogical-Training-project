import React from "react";
import "../style/MySimulations.css";
import { Link } from "react-router-dom";
import { authStore } from "../store/authStore";
import { useEffect, useState } from "react";
import { mainPageStore } from "../store/mainPageStore";

export default function MySimulations() {
  const [user, setUser] = useState(null);
  const { logout } = authStore();
  const { fetchUser } = mainPageStore();

  // DUMMY DATA (replace with backend data later)
  const simulations = [
    { id: "1", date: "April 10, 2024", className: "Class C", score: 38 },
    { id: "2", date: "March 22, 2024", className: "Class B", score: 29 },
    { id: "3", date: "March 5, 2024", className: "Class A", score: 35 },
  ];
    useEffect(() => {
    const load = async () => {
      const u = await fetchUser();
      setUser(u);
    };
    load();
  }, []);

  const handleLogout = () => logout();

  return (
    <div>
           {/* ===== NAVBAR ===== */}
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
          <li>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </li>
          <li><Link to="/lang">🌐 ENG</Link></li>
        </ul>
      </nav>
      {/* ================= PAGE CONTENT ================= */}
      <div className="simulation-page-container">
        <h1 className="title">View My Simulations</h1>

        <div className="table-container">
          <div className="table-header">
            <span>Date</span>
            <span>Class</span>
            <span>Total Score</span>
            <span></span>
          </div>

          {simulations.map((sim) => (
            <div key={sim.id} className="table-row">
              <span>{sim.date}</span>

              <span className="class-name">
                <span className="class-icon">🧑‍🏫</span> {sim.className}
              </span>

              <span>{sim.score}</span>

              <span className="actions">
                <button className="feedback-btn">Feedback</button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
