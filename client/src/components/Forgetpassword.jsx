import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Forgetpassword.css";
import { authStore } from "../store/authStore";

const ForgetPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const { VerifyEmail, ResetPassword } = authStore();
  const navigate = useNavigate();

  
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    const ok = await VerifyEmail({ step: "request", Email: email });
    if (ok) setStep(2);
  };


  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match ❌");
      return;
    }
    const ok = await ResetPassword({
      step: "reset",
      Email: email,
      code,
      newPassword,
    });
    if (ok) navigate("/Login"); 
  };

  return (
    <div className="forget-page">
      <div className="forget-card">
        <h2>Forgot Password</h2>
        <p className="subtitle">We’ll send you a code to reset your password</p>

        {message && <p className="msg">{message}</p>}

        {step === 1 && (
          <form onSubmit={handleVerifyEmail} className="forget-form">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-forget">Verify</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="forget-form">
            <label>Verification Code</label>
            <input
              type="text"
              placeholder="Enter the code from your email"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />

            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button type="submit" className="btn-forget">Reset Password</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgetPassword;