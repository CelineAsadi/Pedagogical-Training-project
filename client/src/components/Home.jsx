/**
 * Home Page Component
 * This file implements the main landing page of the application.
 * The home page introduces the Pedagogical Training platform,
 * highlights its core features, and provides navigation to
 * authentication and contact pages.
 * It also includes a short tutorial video to help new users
 * understand how to use the system.
 */
import "../style/Home.css";
import { useState } from "react";

const Home = () => {
    const [open, setOpen] = useState(false);
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <img src="/ourLogo.png" alt="Pedagogical Training" />
        </div>
        <ul className="nav-links">
           <li><a href="/">Home</a></li>
           <li><a href="/contact">Contact</a></li>
           <li><a href="/login">Login</a></li>
          <li><a href="/Signup">Signup</a></li>
        </ul>
      </nav>
      {/* Hero */}
      <section className="hero">
        <div className="hero-text">
          <h1>Improve Your <span>Teaching Skills</span> with AI</h1>
          <p>
            Pedagogical Training is an AI-powered simulation platform that helps
            teachers practice classroom management in a safe and realistic environment.
          </p>
        </div>
        <div className="hero-media">
      <p>Video Tutorial: How to Use Our Website– Click on the video to watch</p>
              <video 
        className="preview-video"
        src=""
        controls
        muted
        preload="metadata"
        poster=""
        onClick={() => setOpen(true)}
      ></video>
      {/* Modal */}
      {open && (
        <div className="overlay">
          <div className="video-modal">
            <button className="close-btn" onClick={() => setOpen(false)}>
              ✖
            </button>
            <video width="600" controls autoPlay>
              <source src="/tutorial.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </div>
      </section>
      {/* Features */}
      <section className="features">
        <div className="feature">
          <h3>Voice Recognition</h3>
          <p>Analyze teacher responses using advanced voice technology.</p>
        </div>
        <div className="feature">
          <h3>AI Feedback</h3>
          <p>Get instant AI-based suggestions to improve classroom management.</p>
        </div>
        <div className="feature">
          <h3>Realistic Scenarios</h3>
          <p>Practice in a virtual classroom with dynamic student behavior.</p>
        </div>
      </section>
    </div>
  );
};
export default Home;