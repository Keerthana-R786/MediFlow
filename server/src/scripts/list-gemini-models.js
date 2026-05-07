require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const listModels = async () => {
  console.log('Checking Gemini API key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  console.log('\nFetching available models...\n');
  
  try {
    // Try to list models
    const models = await genAI.listModels();
    
    console.log('✓ Available models:');
    console.log('='.repeat(60));
    
    for await (const model of models) {
      console.log(`\nModel: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\nRecommended models for text generation:');
    console.log('  - gemini-pro');
    console.log('  - gemini-1.5-pro');
    console.log('  - gemini-1.5-flash');
    console.log('  - gemini-2.0-flash-exp');
    
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    console.error('\nTrying common model names directly...\n');
    
    // Try common model names
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-002',
      'gemini-2.0-flash-exp',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash',
    ];
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        const text = result.response.text();
        console.log(`✓ ${modelName} - WORKS`);
      } catch (err) {
        console.log(`✗ ${modelName} - ${err.message.split('\n')[0]}`);
      }
    }
  }
};

listModels().catch(console.error);
