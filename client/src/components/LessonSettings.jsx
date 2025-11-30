import React, { useEffect, useState } from "react";
import "../style/LessonSettings.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { lessonSettingsStore } from "../store/lessonSettingsStore";
import { authStore } from "../store/authStore";

const LessonSettings = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { logout } = authStore();
  const { saveLessonSettings, fetchUserData } = lessonSettingsStore();

  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get("topic") || "";

  const [lessonTopic] = useState(initialTopic);
  const [classSize, setClassSize] = useState(5);
  const [duration, setDuration] = useState(5);
  const [className, setClassName] = useState("");

  const [studentTypes, setStudentTypes] = useState([
    { name: "Attentive", count: 0 },
    { name: "Talker", count: 0 },
    { name: "Defiant", count: 0 },
    { name: "Sensitive", count: 0 },
    { name: "Withdrawn", count: 0 },
    { name: "Conflicts", count: 0 },
    { name: "Sarcastic", count: 0 },
    { name: "Hyperactive", count: 0 },
    { name: "Neutral", count: 0 },
  ]);

  const totalStudents = studentTypes.reduce((sum, t) => sum + t.count, 0);

  const updateCount = (index, delta) => {
    const updated = [...studentTypes];
    const newValue = updated[index].count + delta;
    if (newValue < 0) return;
    updated[index].count = newValue;
    setStudentTypes(updated);
  };

  useEffect(() => {
    fetchUserData(setUser);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!className.trim()) {
      toast.error("Please enter a class name.");
      return;
    }

    if (totalStudents !== classSize) {
      toast.error("Total students must match the class size!");
      return;
    }

    const success = await saveLessonSettings({
      classSize,
      duration,
      studentTypes,
      className,
      lessonTopic,
    });

    if (success) {
      navigate(success); // success returns classroom URL
    }
  };

  return (
    <div className="lesson-page">
      
      {/* Navbar */}
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
          <li><button className="logout-btn" onClick={logout}>Logout</button></li>
          <li><Link to="/lang">🌐 ENG</Link></li>
        </ul>
      </nav>

      {/* Page Content */}
      <div className="lesson-settings">
        <h2>Lesson Settings</h2>

        <form onSubmit={handleSubmit}>
          <div className="settings-grid">
            
            {/* Left card */}
            <div className="settings-card">
              <h3>General</h3>

              <div className="form-group">
                <label>Class Name</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Class Size (5–15)</label>
                <input
                  type="number"
                  min="5"
                  max="15"
                  value={classSize}
                  onChange={(e) => setClassSize(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Lesson Duration (5–10 min)</label>
                <input
                  type="number"
                  min="5"
                  max="10"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>

              <div className="total-row">
                <strong>Total Students:</strong> {totalStudents} / {classSize}
              </div>

              <button type="submit" className="btn-save">Save Settings</button>
            </div>

            {/* Right card */}
            <div className="settings-card">
              <h3>Student Types</h3>
              {studentTypes.map((type, i) => (
                <div key={i} className="type-row">
                  <span className="type-name">{type.name}</span>
                  <div className="counter">
                    <button type="button" onClick={() => updateCount(i, -1)}>-</button>
                    <span>{type.count}</span>
                    <button type="button" onClick={() => updateCount(i, +1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonSettings;
