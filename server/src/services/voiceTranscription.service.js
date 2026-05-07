const { generateText } = require('../config/ai');

/**
 * Transcribe audio to text using Groq Whisper API
 * Note: This is a placeholder. In production, you would use:
 * - Groq Whisper API for transcription
 * - Or OpenAI Whisper API
 * - Or Google Speech-to-Text
 * - Or Azure Speech Services
 */
const transcribeAudio = async (audioFilePath, language = 'en') => {
  // Placeholder implementation
  // In production, integrate with actual speech-to-text API
  
  console.log(`[Voice] Transcribing audio file: ${audioFilePath}, language: ${language}`);
  
  // For now, return a mock transcription
  return {
    text: "Patient complains of headache for 3 days. Pain is throbbing, located in frontal region. No fever. No vomiting. Taking paracetamol with partial relief.",
    confidence: 0.95,
    language: language,
  };
};

/**
 * Convert transcription to structured SOAP notes using AI
 */
const generateSOAPNotes = async (transcription, patientContext) => {
  try {
    const prompt = `Convert the following doctor's voice notes into structured SOAP format:

Transcription:
"${transcription}"

Patient Context:
- Name: ${patientContext.name}
- Age: ${patientContext.age}
- Chief Complaint: ${patientContext.chiefComplaint}

Generate structured SOAP notes in JSON format:
{
  "subjective": "Patient's complaints and symptoms in their words",
  "objective": "Physical examination findings and vital signs",
  "assessment": "Clinical diagnosis or impression",
  "plan": "Treatment plan, medications, investigations, follow-up"
}

Keep it concise and clinically relevant. Return ONLY the JSON object.`;

    const messages = [
      {
        role: 'system',
        content: 'You are a medical documentation assistant. Convert doctor voice notes into structured SOAP format.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await generateText(messages, {
      temperature: 0.3,
      maxTokens: 500,
    });

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback if JSON parsing fails
    return {
      subjective: transcription,
      objective: '',
      assessment: '',
      plan: '',
    };
  } catch (error) {
    console.error('[Voice] SOAP generation error:', error);
    // Return basic structure with transcription
    return {
      subjective: transcription,
      objective: '',
      assessment: '',
      plan: '',
    };
  }
};

module.exports = {
  transcribeAudio,
  generateSOAPNotes,
};
