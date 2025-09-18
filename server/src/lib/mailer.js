// email.js
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const verificationCodes = {};

async function sendEmail(receiverEmail, subject, variableValue) {
  try {
    console.log(process.env.EMAIL_ADMIN,process.env.EMAIL_APP_PASS);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ADMIN,
        pass: process.env.EMAIL_APP_PASS
      }
    });

    const mailOptions = {
      from: "support@chat.com",
      to: receiverEmail,
      subject: subject,
      html: variableValue
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err);
      } else {
        console.log("email sent: " + info.response);
      }
    });
  } catch (err) {
    console.log(err);
  }
}

 function generateFourDigitCode() {
  const min = 1000;
  const max = 9999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports={
    sendEmail,
    generateFourDigitCode
};