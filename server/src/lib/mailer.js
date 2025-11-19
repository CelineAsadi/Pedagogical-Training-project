// email.js - Using Gmail API (No SMTP, works on Render)
const { google } = require("googleapis");
require("dotenv").config();

async function sendEmail(receiverEmail, subject, htmlContent) {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground" // Redirect URI
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    // Get fresh access token
    const accessToken = await oAuth2Client.getAccessToken();

    // Use Gmail API
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Encode email as base64 (required by Gmail API)
    const rawMessage = Buffer.from(
      `To: ${receiverEmail}\r\n` +
      `From: "Pedagogical Training" <${process.env.EMAIL_ADMIN}>\r\n` +
      `Subject: ${subject}\r\n` +
      `Content-Type: text/html; charset="UTF-8"\r\n\r\n` +
      htmlContent
    ).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Send email via Gmail API
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: rawMessage }
    });

    console.log("✅ Email sent successfully:", result.data.id);
    return true;

  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
}

function generateFourDigitCode() {
  return Math.floor(1000 + Math.random() * 9000);
}

module.exports = { sendEmail, generateFourDigitCode };