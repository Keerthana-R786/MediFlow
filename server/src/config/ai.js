const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Determine which AI provider to use
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq'; // 'groq' or 'gemini'

// Initialize Groq client
let groqClient = null;
if (AI_PROVIDER === 'groq' && process.env.GROQ_API_KEY) {
  groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

// Initialize Gemini client
let geminiClient = null;
if (AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Generate text using the configured AI provider with proper chat format
 * @param {Array|string} messages - Chat messages array or single prompt string
 * @param {object} options - Additional options (temperature, maxTokens, etc.)
 * @returns {Promise<string>} - The generated text
 */
const generateText = async (messages, options = {}) => {
  const {
    temperature = 0.7,
    maxTokens = 2000,
    model = null,
  } = options;

  try {
    if (AI_PROVIDER === 'groq' && groqClient) {
      // Use Groq with proper chat format
      const modelName = model || 'llama-3.3-70b-versatile';
      
      // Convert to chat messages format if it's a string
      let chatMessages = typeof messages === 'string' 
        ? [{ role: 'user', content: messages }]
        : messages;
      
      // Groq requires at least one message and doesn't always support 'system' role
      // Convert system messages to user messages for better compatibility
      chatMessages = chatMessages.map(msg => {
        if (msg.role === 'system') {
          return { role: 'user', content: msg.content };
        }
        return msg;
      });
      
      const completion = await groqClient.chat.completions.create({
        messages: chatMessages,
        model: modelName,
        temperature,
        max_tokens: maxTokens,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      if (!responseText) {
        throw new Error('Empty response from Groq API');
      }
      
      return responseText;
    } 
    else if (AI_PROVIDER === 'gemini' && geminiClient) {
      // Use Gemini (only supports single prompt)
      const modelName = model || 'gemini-2.0-flash';
      const geminiModel = geminiClient.getGenerativeModel({ model: modelName });
      
      // Convert chat messages to single prompt if needed
      const prompt = typeof messages === 'string' 
        ? messages 
        : messages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const result = await geminiModel.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      if (!responseText) {
        throw new Error('Empty response from Gemini API');
      }
      
      return responseText;
    }
    else {
      throw new Error(`AI provider "${AI_PROVIDER}" is not configured or API key is missing`);
    }
  } catch (error) {
    // Log the full error for debugging
    console.error('[AI] Generation error:', error.message);
    console.error('[AI] Provider:', AI_PROVIDER);
    
    // Re-throw with more context
    throw error;
  }
};

/**
 * Get information about the current AI provider
 */
const getProviderInfo = () => {
  return {
    provider: AI_PROVIDER,
    isConfigured: (AI_PROVIDER === 'groq' && !!groqClient) || (AI_PROVIDER === 'gemini' && !!geminiClient),
    model: AI_PROVIDER === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.0-flash',
  };
};

module.exports = {
  generateText,
  getProviderInfo,
  AI_PROVIDER,
};
