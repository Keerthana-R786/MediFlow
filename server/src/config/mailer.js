const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail service instead of manual SMTP config
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Add connection pooling and timeout settings
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,
  socketTimeout: 60000,
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
