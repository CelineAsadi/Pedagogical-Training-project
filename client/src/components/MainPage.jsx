import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; 
import { axiosInstance } from "../lib/axios";
import "../style/MainPage.css";
import { authStore } from "../store/authStore";
const MainPage = () => {
  const [user, setUser] = useState(null);
  const {logout}=authStore();

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
    // try {
    //   await axiosInstance.post("/auth/Logout");
    //   // navigate("/"); 
    // } catch (err) {
    //   console.error("Logout failed:", err);
    // }
    logout();
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
        <div className="buttons">
          <button className="btn">ENTER THE STANDARD VIRTUAL CLASSROOM</button>
          <button className="btn">SET UP A CLASSROOM</button>
        </div>
      </section>
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
        <li><a href="/contact">Contact</a></li> {/*link*/} 
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
