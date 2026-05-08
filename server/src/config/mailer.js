const nodemailer = require('nodemailer');
const { sendEmailViaBrevo } = require('./brevo');

// Determine which email service to use
const useBrevo = !!process.env.BREVO_API_KEY;

// Create transporter with fallback handling (for Gmail)
let transporter;
let isMailerReady = false;

if (!useBrevo) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 1,
      connectionTimeout: 10000, // 10 seconds - fail fast
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify transporter on startup - but don't block
    transporter.verify((error, success) => {
      if (error) {
        console.error('[MAILER] ❌ Gmail SMTP connection failed:', error.message);
        console.error('[MAILER] ⚠️ Email notifications will be disabled');
        isMailerReady = false;
      } else {
        console.log('[MAILER] ✅ Gmail SMTP server is ready to send emails');
        isMailerReady = true;
      }
    });
  } catch (error) {
    console.error('[MAILER] ❌ Failed to create Gmail transporter:', error.message);
    isMailerReady = false;
  }
} else {
  console.log('[MAILER] ✅ Using Brevo API for email delivery');
  isMailerReady = true;
}

module.exports = { 
  transporter, 
  isMailerReady: () => isMailerReady,
  useBrevo,
  sendEmailViaBrevo
};
