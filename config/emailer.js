require("dotenv").config();
const nodemailer = require("nodemailer");

// Configure transporter using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your App Password
  },
});

// Function to send emails with HTML content
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html, // Send HTML content instead of text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: to ${to}`, info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
