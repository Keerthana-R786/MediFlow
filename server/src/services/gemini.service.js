const { generateText } = require('../config/ai');

// Check if we should use mock mode (when API quota is exceeded)
const USE_MOCK_MODE = process.env.GEMINI_MOCK_MODE === 'true';

const INTERVIEW_SYSTEM_PROMPT = `You are a professional medical intake assistant for a healthcare clinic. Your role is to conduct a focused pre-visit interview with patients before they see their doctor.

Your behaviour:
- Ask ONE clear, simple question at a time. Use everyday language that anyone can understand.
- Be warm, professional, and empathetic — like a caring nurse.
- Focus on gathering MEDICALLY USEFUL information that helps the doctor diagnose and treat.
- Avoid unnecessary questions. Every question should have clinical value.
- Use simple words: say "pain" not "discomfort", "started" not "onset", "how bad" not "severity"

INTELLIGENT QUESTION STRATEGY:
1. Start with: "What problem brings you here today?" (chief complaint)
2. Then ask ONLY relevant follow-ups based on their answer:
   - When did it start? (timing is critical)
   - How bad is it? (1-10 scale or mild/moderate/severe)
   - Where exactly? (location matters)
   - What does it feel like? (sharp, dull, burning, etc.)
   - Does it spread anywhere? (radiation)
   - What makes it worse? What makes it better? (aggravating/relieving factors)
   - Any other symptoms with it? (associated symptoms)
   - Has this happened before? (history)
   - Taking any medicines for it? (current treatment)

3. RED FLAG DETECTION - If patient mentions these, ask targeted follow-ups:
   - Chest pain → Ask about: arm/jaw pain, sweating, breathing difficulty
   - Headache → Ask about: sudden onset, worst ever, vision changes, neck stiffness
   - Abdominal pain → Ask about: vomiting, fever, blood in stool
   - Breathing problems → Ask about: chest pain, leg swelling, cough
   - Fever → Ask about: how high, how long, other symptoms

4. EMERGENCY SIGNALS - Immediately output {"emergency": true, "reason": "..."} if patient reports:
   - Chest pain with arm pain/sweating/breathing difficulty
   - Sudden severe headache ("worst of my life")
   - Difficulty breathing at rest
   - Loss of consciousness
   - Severe bleeding
   - Sudden vision loss
   - Stroke symptoms (face drooping, arm weakness, speech difficulty)

5. KEEP IT SHORT - Aim for 6-10 questions total. Stop when you have:
   - Chief complaint clearly described
   - Key symptom characteristics (when, where, how bad, what type)
   - Red flags ruled in/out
   - Impact on daily life
   - Current medications if relevant

6. END GRACEFULLY - After 6-10 meaningful exchanges, say: "Thank you for sharing this information. Your doctor will review everything before your appointment." Then output: {"interview_complete": true}

LANGUAGE RULES:
- Use simple words a village person would understand
- Avoid: "onset", "duration", "exacerbating", "alleviating", "associated"
- Use: "started", "how long", "makes worse", "makes better", "other symptoms"
- Keep questions under 40 words
- One question per message

DO NOT:
- Ask about medical history already in the system
- Suggest diagnoses or treatments
- Ask vague questions like "anything else?"
- Repeat questions already answered
- Use medical jargon`;

const BRIEF_SYSTEM_PROMPT = `You are a senior clinical documentation specialist. Based on the patient intake interview, generate a structured pre-visit clinical brief for the attending doctor.

The brief must be:
- Clinically precise and actionable
- Concise — readable in under 60 seconds
- Focused on information that aids diagnosis and treatment planning
- Honest about information gaps
- Free of speculation

INTELLIGENCE GUIDELINES:
- Identify patterns that suggest specific conditions
- Flag red flags prominently
- Suggest relevant investigations based on presentation
- Provide differential diagnosis clusters (not specific diagnoses)
- Calculate urgency based on symptom severity and red flags

Output a valid JSON object with exactly this structure:
{
  "chiefComplaint": "One sentence, patient's own words where possible",
  "symptomSummary": "2-3 sentences covering: location, quality, severity, timing, modifying factors",
  "clinicalTimeline": "Brief chronological narrative: when started → how progressed → current state",
  "relevantHistory": "Relevant past medical history, medications, allergies from patient profile (if available)",
  "riskFlags": [
    { "flag": "Specific red flag or concern", "severity": "low|moderate|high", "notes": "Clinical significance" }
  ],
  "suggestedFocusAreas": ["Specific examination area 1", "Specific examination area 2"],
  "suggestedTests": ["Test 1 with brief rationale", "Test 2 with brief rationale"],
  "differentialClusters": ["Condition category 1", "Condition category 2", "Condition category 3"],
  "urgencyScore": 1-10,
  "urgencyLevel": "low|moderate|high|critical",
  "interviewQuality": "complete|partial|minimal"
}

URGENCY SCORING:
- 1-3 (low): Routine, non-urgent, chronic stable conditions
- 4-6 (moderate): Acute but not immediately threatening, needs same-day attention
- 7-8 (high): Potentially serious, needs prompt evaluation
- 9-10 (critical): Life-threatening, needs immediate intervention

Return ONLY the JSON object, no markdown, no explanation.`;

// Mock interview questions for testing when API quota is exceeded
const MOCK_QUESTIONS = [
  "What problem brings you here today?",
  "When did this start?",
  "How bad is it on a scale of 1 to 10?",
  "Where exactly do you feel it?",
  "Does anything make it worse or better?",
  "Do you have any other symptoms with it?",
  "Thank you for sharing this information. Your doctor will review everything before your appointment.",
];

/**
 * Send a message in the intake interview and get the next AI question.
 */
const conductInterview = async (conversationHistory, patientContext) => {
  // Mock mode for testing when quota exceeded
  if (USE_MOCK_MODE) {
    const questionIndex = Math.floor(conversationHistory.length / 2);
    const isComplete = questionIndex >= MOCK_QUESTIONS.length - 1;
    
    const text = isComplete 
      ? "Thank you for providing all this information. Your doctor will review this before your appointment."
      : MOCK_QUESTIONS[questionIndex] || MOCK_QUESTIONS[MOCK_QUESTIONS.length - 1];
    
    return { 
      text, 
      emergencyFlag: null, 
      interviewComplete: isComplete 
    };
  }

  // Real AI mode with proper chat format
  try {
    // Build chat messages array with system prompt as first user message
    const systemPrompt = `${INTERVIEW_SYSTEM_PROMPT}

Patient Information:
- Name: ${patientContext.name}
- Chief Complaint: ${patientContext.chiefComplaint}
- Appointment Type: ${patientContext.appointmentType}
- Doctor: ${patientContext.doctor}

IMPORTANT: 
1. Review the conversation history to avoid repeating questions
2. Ask ONE focused, medically useful question at a time
3. Use simple language anyone can understand
4. After 6-10 meaningful exchanges, thank the patient and output {"interview_complete": true}
5. Keep responses under 40 words
6. Focus on information that helps the doctor diagnose and treat`;

    const chatMessages = [];
    
    // Add conversation history (limit to last 10 messages to keep context manageable)
    const recentHistory = conversationHistory.slice(-10);
    
    if (recentHistory.length === 0) {
      // First message - include system prompt
      chatMessages.push({
        role: 'user',
        content: systemPrompt + '\n\nStart the interview by asking about the chief complaint.'
      });
    } else {
      // Subsequent messages - add history
      chatMessages.push({
        role: 'user',
        content: systemPrompt
      });
      
      chatMessages.push({
        role: 'assistant',
        content: 'I understand. I will conduct a professional medical intake interview.'
      });
      
      recentHistory.forEach(msg => {
        chatMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      });
    }

    console.log('[AI] Generating response with', recentHistory.length, 'messages in history');

    const text = await generateText(chatMessages, {
      temperature: 0.7,
      maxTokens: 150,
    });

    console.log('[AI] Response generated:', text.substring(0, 100));

    // Check for special signals
    let emergencyFlag = null;
    let interviewComplete = false;
    let cleanText = text;

    const emergencyMatch = text.match(/\{[\s\n]*"emergency"[\s\n]*:[\s\n]*true[^}]*\}/);
    if (emergencyMatch) {
      try { 
        emergencyFlag = JSON.parse(emergencyMatch[0]); 
        console.log('[AI] Emergency flag detected:', emergencyFlag);
      } catch (_) {}
      cleanText = text.replace(emergencyMatch[0], '').trim();
    }

    const completeMatch = text.match(/\{[\s\n]*"interview_complete"[\s\n]*:[\s\n]*true[\s\n]*\}/);
    if (completeMatch) {
      interviewComplete = true;
      cleanText = text.replace(completeMatch[0], '').trim();
      console.log('[AI] Interview completion signal detected');
      
      // If no text remains after removing the completion signal, add a default message
      if (!cleanText || cleanText.length < 10) {
        cleanText = "Thank you for providing all this information. Your doctor will review this before your appointment.";
      }
    }

    // Auto-complete after 12 messages (6 exchanges) if AI hasn't signaled completion
    if (conversationHistory.length >= 12 && !interviewComplete) {
      console.log('[AI] Auto-completing interview after 12 messages');
      interviewComplete = true;
      if (!cleanText.toLowerCase().includes('thank you')) {
        cleanText = "Thank you for sharing this information. Your doctor will review everything before your appointment.";
      }
    }

    return { text: cleanText, emergencyFlag, interviewComplete };
  } catch (error) {
    console.error('[AI] Interview error:', error.message);
    console.error('[AI] Error stack:', error.stack);
    
    // If quota exceeded, provide helpful error message
    if (error.message && error.message.includes('quota') || error.message.includes('429')) {
      throw new Error('AI service quota exceeded. Please try again later or contact support.');
    }
    
    // If rate limit
    if (error.message && (error.message.includes('rate_limit') || error.message.includes('Rate limit'))) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    // Generic error
    throw new Error('Unable to process your response. Please try again.');
  }
};

/**
 * Generate a structured patient brief from the completed intake session.
 */
const generateBrief = async (patientProfile, interviewTranscript) => {
  // Mock mode for testing
  if (USE_MOCK_MODE) {
    const parsed = {
      chiefComplaint: "Patient reported symptoms during intake",
      symptomSummary: "Symptoms documented in intake session",
      clinicalTimeline: "Timeline documented during patient interview",
      relevantHistory: "Medical history as provided by patient",
      riskFlags: [
        { flag: "Routine follow-up", severity: "low", notes: "Standard consultation" }
      ],
      suggestedFocusAreas: ["Chief complaint", "Symptom assessment"],
      suggestedTests: ["Physical examination"],
      differentialClusters: ["To be determined during consultation"],
      urgencyScore: 3,
      urgencyLevel: "low",
      interviewQuality: "complete"
    };
    return { parsed, raw: JSON.stringify(parsed, null, 2) };
  }

  // Real AI mode
  try {
    const messages = [
      {
        role: 'system',
        content: BRIEF_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Generate a clinical brief based on this information:

Patient Profile:
${JSON.stringify(patientProfile, null, 2)}

Intake Interview Transcript:
${interviewTranscript}

Return ONLY a valid JSON object with the required structure. No markdown, no explanation.`
      }
    ];

    const raw = await generateText(messages, {
      temperature: 0.2,
      maxTokens: 2000,
    });

    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(jsonStr);
    return { parsed, raw };
  } catch (error) {
    console.error('[AI] Brief generation error:', error.message);
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      throw new Error('AI service quota exceeded. Please try again later or contact support.');
    }
    throw error;
  }
};

module.exports = { conductInterview, generateBrief };
