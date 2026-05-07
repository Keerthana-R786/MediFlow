const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-2.0-flash (stable model with broad access)
const getModel = () => genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

module.exports = { genAI, getModel };
