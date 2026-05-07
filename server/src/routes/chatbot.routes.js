const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const { authenticate } = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

// All routes require authentication
router.use(authenticate);

// Chat with AI assistant
router.post('/chat', asyncHandler(chatbotController.chat));

module.exports = router;
