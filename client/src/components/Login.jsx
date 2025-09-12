// // Import necessary hooks and utilities from React, axios for HTTP requests, and react-router-dom for navigation
// import { useState } from 'react'; // Import useState and useEffect from React
// import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom
// import { axiosInstance } from '../lib/axios';

// // Define a custom hook for managing login logic
// const Login = ()=>{

//    const handleClick = async()=>{
//     await axiosInstance.post('auth/Login',{Email:"celine@email.com",password:"123456"})
//    }

//     return <div>
//         <button onClick={handleClick}>button</button>
//     </div>
// };


// export default Login;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import "../style/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await axiosInstance.post("/auth/login", {
        Email: email,
        password,
      });

      setSuccess(res.data.message || "Login successful 🎉");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);

      setTimeout(() => {
        setError("");
      }, 1000);
    }
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
         Forget password? <a href="/">Reset here</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
