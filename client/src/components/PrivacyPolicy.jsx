/**
 * PrivacyPolicy
 * Displays the platform’s privacy policy in a clear and structured layout.
 * Responsibilities:
 * - Present information about data collection and usage
 * - Explain security and data protection practices
 * - Inform users of their rights regarding personal data
 * - Provide a direct link to the contact page for privacy-related inquiries
 */
import "../style/PrivacyPolicy.css";
const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      <div className="privacy-card">
        <h1 className="privacy-title">Privacy Policy</h1>
        <p className="privacy-date">Effective Date: 2025</p>
        <section className="privacy-section">
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide when signing up, such as your name,
            email address, and teaching experience. This information is used to
            personalize your experience and improve our platform.
          </p>
        </section>
        <section className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <p>
            We use your data to provide secure access, enhance your learning journey,
            and send important updates. We never sell your information to third parties.
          </p>
        </section>
        <section className="privacy-section">
          <h2>3. Data Protection</h2>
          <p>
            We implement strict security measures to protect your information. All
            sensitive data is encrypted and stored securely.
          </p>
        </section>
        <section className="privacy-section">
          <h2>4. Your Rights</h2>
          <p>
            You may request access, updates, or deletion of your personal data by
            contacting our support team at any time.
          </p>
        </section>
        <section className="privacy-section">
          <h2>5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, feel free to contact us
            through the <a href="/contact">Contact Page</a>.
          </p>
        </section>
        <div className="privacy-footer">
          <p>© 2025 Pedagogical Training. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
export default PrivacyPolicy;