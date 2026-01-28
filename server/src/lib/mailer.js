/**
 * Email Utility (Gmail API)
 * ------------------------
 * This file provides email-sending functionality using the Gmail API
 * instead of traditional SMTP.
 *
 * It is designed to work reliably on platforms like Render where
 * SMTP ports may be restricted.
 *
 * Features:
 * - OAuth2-based authentication with Gmail
 * - HTML email support
 * - Secure token refresh using a refresh token
 * - Utility for generating verification codes
 */
const { google } = require("googleapis");
require("dotenv").config();

/**
 * Sends an HTML email using the Gmail API and OAuth2 authentication.
 * This function:
 * - Authenticates with Gmail using OAuth2
 * - Generates a fresh access token
 * - Encodes the email in Base64 format
 * - Sends the email via the Gmail API
 */
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

/**
 * Generates a random four-digit numeric verification code.
 * Commonly used for:
 * - Email verification
 * - Password reset flows
 */
function generateFourDigitCode() {
  return Math.floor(1000 + Math.random() * 9000);
}

module.exports = { sendEmail, generateFourDigitCode };