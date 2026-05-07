require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { conductInterview, generateBrief } = require('../services/gemini.service');

const testIntakeAI = async () => {
  console.log('Testing AI Intake Flow with Groq...\n');
  
  // Test 1: Start interview
  console.log('--- Test 1: Starting interview ---');
  const patientContext = {
    name: 'Test Patient',
    chiefComplaint: 'Headache',
    appointmentType: 'consultation',
    doctor: 'Dr. Test',
    language: 'english',
  };
  
  try {
    const result1 = await conductInterview([], patientContext);
    console.log('✓ First question:', result1.text);
    console.log('  Emergency flag:', result1.emergencyFlag || 'None');
    console.log('  Interview complete:', result1.interviewComplete);
    
    // Test 2: Patient response
    console.log('\n--- Test 2: Patient responds ---');
    const conversation = [
      { role: 'assistant', content: result1.text },
      { role: 'patient', content: 'I have been having severe headaches for the past 3 days' }
    ];
    
    const result2 = await conductInterview(conversation, patientContext);
    console.log('✓ Follow-up question:', result2.text);
    console.log('  Emergency flag:', result2.emergencyFlag || 'None');
    console.log('  Interview complete:', result2.interviewComplete);
    
    // Test 3: Generate brief
    console.log('\n--- Test 3: Generating brief ---');
    const transcript = `
Assistant: What brings you in today?
Patient: I have been having severe headaches for the past 3 days
Assistant: When did the headaches start?
Patient: Three days ago, suddenly in the morning
Assistant: On a scale of 1-10, how severe is the pain?
Patient: About 8 out of 10
Assistant: Have you taken any medication?
Patient: Yes, I took ibuprofen but it didn't help much
Assistant: Any other symptoms like nausea or vision changes?
Patient: Yes, I feel nauseous and sensitive to light
    `.trim();
    
    const profile = {
      name: 'Test Patient',
      age: 35,
      gender: 'female',
      allergies: [],
      medications: [],
      medicalHistory: []
    };
    
    const brief = await generateBrief(profile, transcript);
    console.log('✓ Brief generated successfully!');
    console.log('\nChief Complaint:', brief.parsed.chiefComplaint);
    console.log('Urgency Level:', brief.parsed.urgencyLevel);
    console.log('Urgency Score:', brief.parsed.urgencyScore);
    console.log('Suggested Focus Areas:', brief.parsed.suggestedFocusAreas?.join(', '));
    
    console.log('\n✅ All AI intake tests passed!');
    console.log('\n🎉 Groq integration is working perfectly!');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.error(err.stack);
  }
};

testIntakeAI().catch(console.error);
