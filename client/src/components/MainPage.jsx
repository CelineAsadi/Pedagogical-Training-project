import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";  
import { axiosInstance } from "../lib/axios";
import "../style/MainPage.css";
import { authStore } from "../store/authStore";

const MainPage = () => {
  const [user, setUser] = useState(null);
  const [lessonTopic, setLessonTopic] = useState("");//add
const [topicConfirmed, setTopicConfirmed] = useState(false);//add

  const { logout } = authStore();
  const navigate = useNavigate();                    

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/auth/check");
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    logout();
  };
// client/src/components/MainPage.jsx (קטע רלוונטי)

const handleEnterBasicClass = async () => {
  try {
    if (!lessonTopic.trim()) {
      alert("Please enter a lesson topic first!");
      return;
    }

    // 1️⃣ יצירת שיעור בסיס בשרת
    const lessonRes = await axiosInstance.post(
      "/lesson/basic",
      { lessonTopic },
      { withCredentials: true }
    );

    const { lessonId, className } = lessonRes.data;

    // 2️⃣ יצירת Session אמיתי
    const sessionRes = await axiosInstance.post(
      "/session/start",
      { lessonId },
      { withCredentials: true }
    );

    const sessionId = sessionRes.data.sessionId;

    // 3️⃣ מעבר לכיתה – חשוב להעביר גם class וגם sessionId
    navigate(
      `/VirtualClassroom?class=${encodeURIComponent(
        className
      )}&sessionId=${sessionId}&type=basic`
    );
  } catch (err) {
    console.error("❌ Error starting basic Session:", err);
    alert("Could not start your session. Try again.");
  }
};



  return (
    <div>
      {/* 🔹 Navbar */}
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

      {/* 🔹 Main Section */}
<section className="main-hero">
  <h1>
    Welcome to <span>Pedagogical Training</span>
  </h1>
  <p>
    Practice classroom management in a safe, AI-powered environment. Choose your path
    and start improving your teaching skills 🚀
  </p>

  {/* ======= שלב הוספת נושא השיעור ======= */}
  {!topicConfirmed ? (
    <div className="topic-input-container">
      <h3>🧠 Please enter your lesson topic:</h3>
      <input
        type="text"
        placeholder="e.g., Fractions, Reading Comprehension..."
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
    /* ======= הכפתורים הרגילים ======= */
    <div className="buttons">
      <button
        className="btn"
        onClick={handleEnterBasicClass}
      >
        ENTER THE STANDARD VIRTUAL CLASSROOM
      </button>

      <button
        className="btn"
        onClick={() => navigate(`/LessonSettings?topic=${encodeURIComponent(lessonTopic)}`)}
      >
        SET UP A CLASSROOM
      </button>
    </div>
  )}
</section>


      {/* 🧩 Virtual Classroom Description */}
      <section className="classroom-info">
        <h2>🎓 Standard Virtual Classroom Overview</h2>
        <p>
          The <strong>standard simulation</strong> includes <strong>15 students</strong> with diverse personalities and classroom behaviors.
        </p>

        <div className="student-summary">
          <ul>
            <li>👀 3 Attentive students</li>
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

      {/* 🔹 Footer */}
      <footer className="footer">
        <div className="footer-container">
          {/* About */}
          <div className="footer-section">
            <h3>Pedagogical Training</h3>
            <p>
              AI-powered platform to help teachers improve classroom management
              through realistic simulations.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/PrivacyPolicy">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Social */}
          <div className="footer-section">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="https://github.com/CelineAsadi/Pedagogical-Training-project" target="_blank" rel="noreferrer">
                <i className="fab fa-github"></i>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 Pedagogical Training. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainPage;
