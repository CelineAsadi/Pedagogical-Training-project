import "../style/Profile.css";
import { authStore } from "../store/authStore";



const Profile = () => {
  const {logout}=authStore();
  const handleLogout = async () => {
    logout();
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
           <li>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </li>
          <li><a href="/lang">🌐 ENG</a></li>
        </ul>
      </nav>

      {/* Profile Container */}
      <div className="profile-container">
        {/* Left: Form */}
        <div className="profile-form-section">
          <h2>Update Profile</h2>
          <p className="subtitle">
            Update your profile to reflect the <span>latest version</span> of yourself ✨
          </p>

          <form className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" placeholder="Enter your first name" />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" placeholder="Enter your last name" />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Enter your email" />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select>
                <option value="">Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Class Level (3-6)</label>
                <select>
                  <option value="">Select class level</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>

              <div className="form-group">
                <label>Teaching Experience</label>
                <select>
                  <option value="">Select experience</option>
                  <option value="0-1">0-1 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </div>
            </div>

            <div className="form-buttons">
              <button type="button" className="btn cancel">Cancel</button>
              <button type="submit" className="btn update">Update</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
