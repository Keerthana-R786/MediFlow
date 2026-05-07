require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const testModel = async (modelName) => {
  console.log(`Testing model: ${modelName}`);
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent('Say hello in one word');
    const text = result.response.text();
    
    console.log(`✓ ${modelName} works!`);
    console.log(`  Response: ${text}\n`);
    return true;
  } catch (err) {
    console.log(`✗ ${modelName} failed`);
    console.log(`  Error: ${err.message}\n`);
    return false;
  }
};

const testModels = async () => {
  console.log('Testing Gemini models for access...\n');
  
  const modelsToTest = [
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite',
    'gemini-pro-latest',
  ];
  
  for (const modelName of modelsToTest) {
    const works = await testModel(modelName);
    if (works) {
      console.log(`\n✓ Recommended: Use "${modelName}" in your config\n`);
      break;
    }
  }
};

testModels().catch(console.error);
