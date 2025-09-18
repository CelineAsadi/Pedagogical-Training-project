import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
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
    // setError("");
    // setSuccess("");

    // try {
    //   const res = await axiosInstance.post("/auth/login", {
    //     Email: email,
    //     password,
    //   });

    //   setSuccess(res.data.message || "Login successful 🎉");

    //   // setTimeout(() => {
    //   //   //navigate("/MainPage");
    //   // }, 1500);
    // } catch (err) {
    //   const errorMessage = err.response?.data?.message || "Login failed";
    //   setError(errorMessage);

    //   // setTimeout(() => {
    //   //   setError("");
    //   // }, 1000);
    // }
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
