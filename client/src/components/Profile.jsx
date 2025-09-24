import "../style/Profile.css";
import { authStore } from "../store/authStore";
import { useState, useEffect } from "react";

const Profile = () => {
  const { authUser, logout, updateProfile, verifyNewEmail } = authStore();

  const [formData, setFormData] = useState({
    FName: "",
    LName: "",
    Email: "",
    Gender: "",
    Classlevel: "",
    TeachExp: ""
  });

  const [emailVerified, setEmailVerified] = useState(true); 
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (authUser) {
      setFormData({
        FName: authUser.FName || "",
        LName: authUser.LName || "",
        Email: authUser.Email || "",
        Gender: authUser.Gender || "",
        Classlevel: authUser.Classlevel || "",
        TeachExp: authUser.TeachExp || ""
      });
      setEmailVerified(true); 
    }
  }, [authUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "Email" && e.target.value !== authUser?.Email) {
      setEmailVerified(false); 
      setCodeSent(false);
    }
  };


  const handleSendCode = async () => {
    const ok = await verifyNewEmail({ step: "request", Email: formData.Email });
    if (ok) setCodeSent(true);
  };


  const handleVerifyCode = async () => {
    const ok = await verifyNewEmail({ step: "verify", Email: formData.Email, code: verificationCode });
    if (ok) setEmailVerified(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!emailVerified) {
      alert("Please verify your new email before updating!");
      return;
    }

    const updatedData = {
      ...formData,
      ProfileImage: formData.Gender === "Female" ? "/female.png" : "/male.png",
    };

    updateProfile(updatedData);
  };

  const handleCancel = () => {
    if (authUser) {
      setFormData({
        FName: authUser.FName || "",
        LName: authUser.LName || "",
        Email: authUser.Email || "",
        Gender: authUser.Gender || "",
        Classlevel: authUser.Classlevel || "",
        TeachExp: authUser.TeachExp || ""
      });
      setEmailVerified(true);
      setCodeSent(false);
      setVerificationCode("");
    }
  };

  return (
    <div className="profile-page">
      {/* Navbar */}
      <nav className="profile-navbar">
        <div className="logo">
          <img src="/ourLogo.png" alt="Pedagogical Training" />
        </div>
        <ul className="profile-nav-links">
          <li><a href="/simulation">My Simulation</a></li>
          <li><a href="/Profile" className="active">Profile</a></li>
          <li><button className="logout-btn" onClick={logout}>Logout</button></li>
          <li><a href="/lang">🌐 ENG</a></li>
        </ul>
      </nav>

      {/* Profile Form */}
      <div className="profile-container">
        <div className="profile-avatar">
          <img
            src={formData.Gender === "Female" ? "/female.png" : "/male.png"}
            alt="Profile Avatar"
          />
          <p className="avatar-caption">{formData.FName} {formData.LName}</p>
        </div>

        <div className="profile-form-section">
          <h2>Update Profile</h2>
          <p className="subtitle">
            Update your profile to reflect the <span>latest version</span> of yourself ✨
          </p>

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" name="FName" value={formData.FName} onChange={handleChange}/>
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" name="LName" value={formData.LName} onChange={handleChange}/>
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="Email" value={formData.Email} onChange={handleChange}/>
              {!emailVerified && (
                <div className="email-verification">
                  {!codeSent ? (
                    <button type="button" className="btn small" onClick={handleSendCode}>
                      Send Code
                    </button>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Enter verification code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                      />
                      <button type="button" className="btn small" onClick={handleVerifyCode}>
                        Verify
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select name="Gender" value={formData.Gender} onChange={handleChange}>
                <option value="">Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Class Level (3-6)</label>
                <select name="Classlevel" value={formData.Classlevel} onChange={handleChange}>
                  <option value="">Select class level</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>

              <div className="form-group">
                <label>Teaching Experience</label>
                <select name="TeachExp" value={formData.TeachExp} onChange={handleChange}>
                  <option value="">Select experience</option>
                  <option value="0-1">0-1 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </div>
            </div>

            <div className="form-buttons">
              <button type="button" className="btn cancel" onClick={handleCancel}>Cancel</button>
              <button type="submit" className="btn update" disabled={!emailVerified}>
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
