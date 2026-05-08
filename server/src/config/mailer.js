const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[MAILER] ❌ SMTP connection failed:', error.message);
  } else {
    console.log('[MAILER] ✅ SMTP server is ready to send emails');
  }
});

module.exports = transporter;
