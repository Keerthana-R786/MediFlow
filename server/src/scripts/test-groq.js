require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { generateText, getProviderInfo } = require('../config/ai');

const testGroq = async () => {
  console.log('Testing AI Configuration...\n');
  
  const info = getProviderInfo();
  console.log('Provider:', info.provider);
  console.log('Model:', info.model);
  console.log('Configured:', info.isConfigured);
  
  if (!info.isConfigured) {
    console.error('\n❌ AI provider is not configured!');
    console.error('Please set GROQ_API_KEY in your .env file');
    console.error('\nTo get a Groq API key:');
    console.error('1. Visit https://console.groq.com/');
    console.error('2. Sign up for free');
    console.error('3. Go to API Keys section');
    console.error('4. Create a new API key');
    console.error('5. Add it to .env as GROQ_API_KEY=your_key_here');
    process.exit(1);
  }
  
  console.log('\n--- Test 1: Simple greeting ---');
  try {
    const response1 = await generateText('Say hello in one sentence.');
    console.log('✓ Response:', response1);
  } catch (err) {
    console.error('✗ Failed:', err.message);
  }
  
  console.log('\n--- Test 2: Medical intake question ---');
  try {
    const response2 = await generateText(
      'You are a medical intake assistant. Ask the patient what brings them in today. Keep it under 30 words.',
      { temperature: 0.8, maxTokens: 100 }
    );
    console.log('✓ Response:', response2);
  } catch (err) {
    console.error('✗ Failed:', err.message);
  }
  
  console.log('\n--- Test 3: JSON generation ---');
  try {
    const response3 = await generateText(
      'Generate a JSON object with fields: name, age, condition. Return ONLY the JSON, no explanation.',
      { temperature: 0.3, maxTokens: 200 }
    );
    console.log('✓ Response:', response3);
    
    // Try to parse it
    const jsonMatch = response3.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✓ Successfully parsed JSON:', parsed);
    }
  } catch (err) {
    console.error('✗ Failed:', err.message);
  }
  
  console.log('\n✅ All tests completed!');
};

testGroq().catch(console.error);
