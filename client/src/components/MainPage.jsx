import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../style/MainPage.css";

import { authStore } from "../store/authStore";
import { mainPageStore } from "../store/mainPageStore";

const MainPage = () => {
  const [user, setUser] = useState(null);
  const [lessonTopic, setLessonTopic] = useState("");
  const [topicConfirmed, setTopicConfirmed] = useState(false);

  const { logout } = authStore();
  const { fetchUser, startBasicLesson } = mainPageStore();

  const navigate = useNavigate();

  // ============================
  // Load user on page load
  // ============================
  useEffect(() => {
    const load = async () => {
      const u = await fetchUser();
      setUser(u);
    };
    load();
  }, []);

  const handleLogout = () => logout();

  // ============================
  // Start basic class
  // ============================
  const handleEnterBasicClass = async () => {
    if (!lessonTopic.trim()) {
      alert("Please enter lesson topic!");
      return;
    }

    const result = await startBasicLesson(lessonTopic);
    if (!result) return;

    navigate(
      `/VirtualClassroom?class=${encodeURIComponent(
        result.className
      )}&sessionId=${result.sessionId}&type=basic`
    );
  };

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
          <li><Link to="/simulation">My Simulation</Link></li>
          <li><Link to="/Profile">Profile</Link></li>
          <li>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </li>
          <li><Link to="/lang">🌐 ENG</Link></li>
        </ul>
      </nav>

      {/* ===== MAIN SECTION ===== */}
      <section className="main-hero">
        <h1>
          Welcome to <span>Pedagogical Training</span>
        </h1>
        <p>
          Practice classroom management in a safe, AI-powered environment.
        </p>

        {/* ===== TOPIC INPUT ===== */}
        {!topicConfirmed ? (
          <div className="topic-input-container">
            <h3>🧠 Please enter your lesson topic:</h3>

            <input
              type="text"
              placeholder="e.g., Fractions, Reading..."
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              className="topic-input"
            />

            <button
              className="btn"
              onClick={() => {
                if (!lessonTopic.trim()) {
                  alert("Please enter a topic first!");
                  return;
                }
                setTopicConfirmed(true);
              }}
            >
              OK
            </button>
          </div>
        ) : (
          /* ===== ACTION BUTTONS ===== */
          <div className="buttons">
            <button className="btn" onClick={handleEnterBasicClass}>
              ENTER THE STANDARD VIRTUAL CLASSROOM
            </button>

            <button
              className="btn"
              onClick={() =>
                navigate(`/LessonSettings?topic=${encodeURIComponent(lessonTopic)}`)
              }
            >
              SET UP A CLASSROOM
            </button>
          </div>
        )}
      </section>

      {/* ===== INFO SECTION ===== */}
      <section className="classroom-info">
        <h2>🎓 Standard Virtual Classroom Overview</h2>
        <p>
          Includes <strong>15 students</strong> with realistic classroom behaviors.
        </p>

        <div className="student-summary">
          <ul>
            <li>👀 3 Attentive</li>
            <li>💬 2 Talkers</li>
            <li>😠 2 Defiant</li>
            <li>😢 2 Sensitive</li>
            <li>😶 2 Withdrawn</li>
            <li>⚔️ 1 Conflicts</li>
            <li>😏 1 Sarcastic</li>
            <li>⚡ 1 Hyperactive</li>
            <li>🙂 1 Neutral</li>
          </ul>
        </div>

        <p className="duration">
          ⏱️ <strong>Lesson Duration:</strong> 5 minutes
        </p>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>Pedagogical Training</h3>
            <p>AI-powered teaching improvement platform.</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/PrivacyPolicy">Privacy Policy</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="https://github.com/CelineAsadi/Pedagogical-Training-project">
                <i className="fab fa-github"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 Pedagogical Training</p>
        </div>
      </footer>
    </div>
  );
};

export default MainPage;
