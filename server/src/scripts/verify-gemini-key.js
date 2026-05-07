require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const https = require('https');

const verifyApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Gemini API Key:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}` : 'NOT FOUND');
  console.log('Key length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.error('\n❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }
  
  console.log('\nTesting API key by listing models...\n');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response status:', res.statusCode);
      
      if (res.statusCode === 200) {
        const parsed = JSON.parse(data);
        console.log('\n✓ API key is valid!\n');
        console.log('Available models:');
        console.log('='.repeat(60));
        
        if (parsed.models && parsed.models.length > 0) {
          parsed.models.forEach(model => {
            const methods = model.supportedGenerationMethods || [];
            if (methods.includes('generateContent')) {
              console.log(`\n✓ ${model.name}`);
              console.log(`  Display: ${model.displayName}`);
              console.log(`  Methods: ${methods.join(', ')}`);
            }
          });
          
          console.log('\n' + '='.repeat(60));
          console.log('\nRecommended model to use:');
          const recommended = parsed.models.find(m => 
            m.name.includes('gemini-1.5-flash') && 
            m.supportedGenerationMethods?.includes('generateContent')
          );
          if (recommended) {
            console.log(`  ${recommended.name.replace('models/', '')}`);
          } else {
            console.log('  Use the first model listed above');
          }
        } else {
          console.log('No models found');
        }
      } else {
        console.error('\n❌ API key validation failed');
        console.error('Status:', res.statusCode);
        console.error('Response:', data);
        
        if (res.statusCode === 400) {
          console.error('\nThe API key appears to be invalid or malformed.');
        } else if (res.statusCode === 403) {
          console.error('\nThe API key is not authorized or has been disabled.');
        } else if (res.statusCode === 404) {
          console.error('\nThe API endpoint was not found. The key might be for a different service.');
        }
      }
    });
  }).on('error', (err) => {
    console.error('❌ Network error:', err.message);
  });
};

verifyApiKey();
