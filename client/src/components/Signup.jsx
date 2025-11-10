import { useState } from "react";
import "../style/Signup.css";
import toast from "react-hot-toast";
import { authStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const { signup, verifyNewEmail } = authStore();
  const navigate = useNavigate();

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

  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendCode = async () => {
    const success = await verifyNewEmail({step: "request",Email: formData.email, });
    if (success)  setCodeSent(true);
  };


  const handleVerifyCode = async () => {
    const success = await verifyNewEmail({ step: "verify",Email: formData.email,code: verificationCode,});

    if (success) {
      setEmailVerified(true);
      setCodeSent(false);}
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!emailVerified) {
      toast.error("Please verify your email before signing up!");
      return;
    }

   const ok = await signup({
      FName: formData.fname,
      LName: formData.lname,
      Email: formData.email,
      password: formData.password,
      Gender: formData.gender,
      Classlevel: formData.classlevel,
      TeachExp: formData.teachExp,
      ProfileImage: formData.gender === "Female" ? "/female.png" : "/male.png",
    });
    if (ok) navigate("/Login"); 

  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Create Account</h2>
        <p className="signup-subtitle">Join us today and start your journey 🚀</p>

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
              disabled={emailVerified}
            />

        
            {!emailVerified ? (
              !codeSent ? (
                <button
                  type="button"
                  className="btn-auth"
                  onClick={handleSendCode}
                >
                  Send Code
                </button>
              ) : (
                <div className="email-verification">
                  <input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-auth"
                    onClick={handleVerifyCode}
                  >
                    Verify
                  </button>
                </div>
              )
            ) : (
              <p className="verified-text">✅ Verified</p>
            )}
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
