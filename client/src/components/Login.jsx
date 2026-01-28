/**
 * Login Page Component
 * This file implements the user login page of the application.
 * It provides a form for users to authenticate using their
 * email address and password.
 * Authentication logic is delegated to the auth store,
 * while this component focuses on user input handling
 * and basic UI feedback.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Login.css";
import { authStore } from "../store/authStore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const {login} = authStore();
  const handleSubmit = async (e) => {
    e.preventDefault();
    login({Email:email,password});
  };
  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Login</h2>
        <p className="login-subtitle">Welcome back! Please enter your details.</p>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <form className="login-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-login">
            Login
          </button>
        </form>
        <p className="login-footer">
         Forget password? <a href="/Forgetpassword">Reset here</a>
        </p>
      </div>
    </div>
  );
};
export default Login;