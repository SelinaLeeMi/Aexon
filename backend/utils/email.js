/**
 * Email Utility - Premium Professional Refactor (with extra debugging)
 * Handles confirmation and password reset emails using SMTP.
 */

const nodemailer = require('nodemailer');

const port = parseInt(process.env.SMTP_PORT, 10);

console.log("Nodemailer config:", {
  host: process.env.SMTP_HOST,
  port: port,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS ? "********" : "MISSING",
  secure: port === 465,
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465, // true for 465 (SSL), false for 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  logger: true, // adds logging
  debug: true   // enables debug output
});

/**
 * Send confirmation code for registration/verification.
 */
exports.sendConfirmationCode = async (to, code) => {
  const mailOptions = {
    from: `"Aexon Support" <${process.env.SUPPORT_EMAIL}>`,
    to,
    subject: "Aexon - Your Confirmation Code",
    text: `Your confirmation code is: ${code}`,
    html: `<h2>Your confirmation code is:</h2><p><b>${code}</b></p>`
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent: ${info.messageId} to ${to}`);
    return info;
  } catch (err) {
    // Print full error for diagnosis
    console.error("Failed to send confirmation code:", err);
    throw new Error("Failed to send confirmation email: " + err.message);
  }
};

/**
 * Send password reset code for password recovery.
 */
exports.sendPasswordResetCode = async (to, code) => {
  const mailOptions = {
    from: `"Aexon Support" <${process.env.SUPPORT_EMAIL}>`,
    to,
    subject: "Aexon - Password Reset Code",
    text: `Your password reset code is: ${code}`,
    html: `<h2>Your password reset code is:</h2><p><b>${code}</b></p>`
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset code sent: ${info.messageId} to ${to}`);
    return info;
  } catch (err) {
    console.error("Failed to send password reset code:", err);
    throw new Error("Failed to send password reset email: " + err.message);
  }
};