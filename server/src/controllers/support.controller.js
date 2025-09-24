const { sendEmail } = require("../lib/mailer");

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
