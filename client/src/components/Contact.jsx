/**
 * Contact Page Component
 * This file implements the "Contact Us" page of the client application.
 * It provides a user-facing form that allows visitors to send
 * questions, feedback, or collaboration requests to the system
 * administrators via the backend support API.
 * The component manages form state locally and delegates
 * submission logic to the support store.
 */
import { useState } from "react";
import "../style/Contact.css";
import { supportStore } from "../store/supportStore";
import { useNavigate } from "react-router-dom";

/**
 * Renders a contact form that enables users to send messages
 * to the platform’s support team.
 * The component:
 * - Manages form input state (name, email, subject, message)
 * - Submits the form via the support store
 * - Redirects the user upon successful submission
 */
const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const { contactUs } = supportStore();
  const navigate = useNavigate(); 
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await contactUs(formData); 
    if (success) {
 setTimeout(() => {
      navigate("/");
    }, 500);   
    }
  };
  return (
    <div className="contact-page">
      <div className="contact-card">
        <h2>Contact Us</h2>
        <p className="contact-subtitle">
          We’d love to hear from you! <br />
          Feel free to reach out with any questions, feedback, or collaboration ideas.
        </p>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
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
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              name="subject"
              placeholder="Enter subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea
              name="message"
              placeholder="Write your message..."
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn-send">Send</button>
        </form>
      </div>
    </div>
  );
};
export default Contact;