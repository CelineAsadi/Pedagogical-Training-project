// email.js (Replaced with Resend)
const { Resend } = require('resend');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Initialize Resend with your API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Generate 4-digit verification code (same as before)
function generateFourDigitCode() {
  const min = 1000;
  const max = 9999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ✅ Send email using Resend
async function sendEmail(receiverEmail, subject, htmlContent) {
  try {
    console.log("📨 Sending email to:", receiverEmail);

    const response = await resend.emails.send({
      from: 'Pedagogical Training <onboarding@resend.dev>',  // You can change this later to your own domain
      to: receiverEmail,
      subject: subject,
      html: htmlContent,
    });

    console.log("✅ Email sent successfully:", response);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

module.exports = {
  sendEmail,
  generateFourDigitCode,
};
