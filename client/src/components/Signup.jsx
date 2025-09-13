import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import "../style/Signup.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    classlevel: "",
    teachExp: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await axiosInstance.post("/auth/Signup", {
        FName: formData.fname,
        LName: formData.lname,
        Email: formData.email,
        password: formData.password,
        Gender: formData.gender,
        Classlevel: formData.classlevel,
        TeachExp: formData.teachExp,
      });

      setSuccess(res.data.message || "Signup successful 🎉");
      setTimeout(() => navigate("/MainPage"), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "Signup failed";
      setError(msg);
      setTimeout(() => setError(""), 10000);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Create Account</h2>
        <p className="signup-subtitle">Join us today and start your journey 🚀</p>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <form className="signup-form" onSubmit={handleSubmit}>
   
          <div className="form-column">
            <label>First Name</label>
            <input
              type="text"
              name="fname"
              placeholder="Enter your first name"
              value={formData.fname}
              onChange={handleChange}
              required
            />

            <label>Last Name</label>
            <input
              type="text"
              name="lname"
              placeholder="Enter your last name"
              value={formData.lname}
              onChange={handleChange}
              required
            />

            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

       
          <div className="form-column">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>

            <label>Class Level (3-6)</label>
            <select
              name="classlevel"
              value={formData.classlevel}
              onChange={handleChange}
              required
            >
              <option value="">Select class level</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>

            <label>Teaching Experience</label>
            <select
              name="teachExp"
              value={formData.teachExp}
              onChange={handleChange}
              required
            >
              <option value="">Select experience</option>
              <option value="0-1">0-1</option>
              <option value="2-5">2-5</option>
              <option value="5+">5+</option>
            </select>
          </div>
        </form>

       
        <button type="submit" className="btn-signup" onClick={handleSubmit}>
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Signup;
