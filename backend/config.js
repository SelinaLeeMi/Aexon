/**
 * Config Utility - Premium Professional Refactor
 * Loads environment config for the app.
 */
require("dotenv").config();

module.exports = {
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "yourverysecurejwtsecret",
  port: process.env.PORT || 5000,
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SUPPORT_EMAIL
  }
};