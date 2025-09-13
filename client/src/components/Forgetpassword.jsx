import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import "../style/Forgetpassword.css";

const ForgetPassword = () => {
  const [step, setStep] = useState(1); // 1 = email, 2 = code+password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

 
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/auth/forgetpassword", { email });
      setMessage(res.data.message || "Verification code sent to your email 📧");
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send verification code");
    }
  };


  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match ❌");
      return;
    }
    try {
      const res = await axiosInstance.post("/auth/resetpassword", {
        email,
        code,
        newPassword,
      });
      setMessage(res.data.message || "Password reset successful ✅");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to reset password");
    }
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
