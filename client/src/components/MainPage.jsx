import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { axiosInstance } from "../lib/axios";
import "../style/MainPage.css";

const MainPage = () => {
  const [user, setUser] = useState(null);
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
    try {
      await axiosInstance.post("/auth/Logout");
      navigate("/"); 
    } catch (err) {
      console.error("Logout failed:", err);
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
          <li><a href="/">Home</a></li>
          <li><a href="/simulation">My Simulation</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/profile">Profile</a></li>
          <li>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </li>
          <li><a href="/lang">🌐 ENG</a></li>
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
        <div className="buttons">
          <button className="btn">ENTER THE STANDARD VIRTUAL CLASSROOM</button>
          <button className="btn">SET UP A CLASSROOM</button>
        </div>
      </section>
    </div>
  );
};

export default MainPage;
