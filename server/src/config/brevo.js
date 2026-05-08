const axios = require('axios');

// Brevo (formerly Sendinblue) API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const sendEmailViaBrevo = async ({ to, subject, htmlContent, from }) => {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured');
  }

  const payload = {
    sender: from || { name: 'MediFlow', email: process.env.SMTP_USER || 'noreply@mediflow.com' },
    to: [{ email: to, name: to.split('@')[0] }],
    subject,
    htmlContent,
  };

  try {
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Brevo API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

module.exports = { sendEmailViaBrevo };
