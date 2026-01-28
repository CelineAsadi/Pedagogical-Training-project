/**
 * Support Controller
 * ------------------
 * This file handles contact and support requests submitted by users.
 *
 * It validates incoming form data and forwards the message
 * to the system support or administrator email address.
 *
 * Typical use cases:
 * - "Contact Us" form
 * - Technical support requests
 * - User feedback and inquiries
 */
const { sendEmail } = require("../lib/mailer");

/**
 * Handles support and contact form submissions.
 * Validates user input and sends the message content
 * to the configured support or admin email address.
 */
const support = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const htmlMessage = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;
    await sendEmail(
      process.env.SUPPORT_EMAIL || process.env.EMAIL_ADMIN, 
      `📩 Contact Form: ${subject}`,
      htmlMessage
    );
    res.status(200).json({ message: "Your message has been sent successfully ✅" });
  } catch (err) {
    console.error("Error in support controller:", err.message);
    res.status(500).json({ message: "Failed to send message ❌" });
  }
};
module.exports = { support };
