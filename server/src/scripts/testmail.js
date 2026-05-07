require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const nodemailer = require('nodemailer');

console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***set***' : 'NOT SET');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify(function (err, success) {
  if (err) {
    console.log('\nSMTP CONNECTION FAILED:', err.message);
    console.log('Full error:', err);
  } else {
    console.log('\nSMTP CONNECTION OK');
    // Send a test email
    transporter.sendMail({
      from: `"MediFlow Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // send to self as test
      subject: 'MediFlow SMTP Test',
      text: 'If you receive this, email is working correctly.',
    }, function (err2, info) {
      if (err2) {
        console.log('SEND FAILED:', err2.message);
      } else {
        console.log('Test email sent! Message ID:', info.messageId);
        console.log('Response:', info.response);
      }
    });
  }
});
