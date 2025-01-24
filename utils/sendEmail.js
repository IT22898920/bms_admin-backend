// utils/sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (subject, message, send_to, sent_from) => {
  // Create a transporter object using Gmail service
  const transporter = nodemailer.createTransport({
    service: "gmail", // Use Gmail SMTP service
    auth: {
      user: sent_from, // Your email address (the one you're sending emails from)
      pass: process.env.EMAIL_PASS, // Email password or app password
    },
  });

  // Define the email options
  const mailOptions = {
    from: sent_from,
    to: send_to,
    subject: subject,
    html: message, // HTML content of the email
  };

  // Send the email and handle any errors
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email not sent, please try again");
  }
};

module.exports = sendEmail; // Export the function to be used elsewhere
