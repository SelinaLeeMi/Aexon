/**
 * Email Utility (Resend Version)
 * Clean, simple, no SMTP, no timeouts.
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM; // onboarding@resend.dev

// Send confirmation code
exports.sendConfirmationCode = async (to, code) => {
  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: "Aexon - Your Confirmation Code",
      html: `<h2>Your confirmation code:</h2><p><b>${code}</b></p>`
    });

    console.log("Confirmation email sent:", result);
    return result;
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
    throw new Error("Failed to send confirmation email");
  }
};

// Send password reset code
exports.sendPasswordResetCode = async (to, code) => {
  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: "Aexon - Password Reset Code",
      html: `<h2>Your password reset code:</h2><p><b>${code}</b></p>`
    });

    console.log("Password reset email sent:", result);
    return result;
  } catch (err) {
    console.error("Failed to send reset email:", err);
    throw new Error("Failed to send password reset email");
  }
};
