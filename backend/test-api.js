const fs = require('fs');
const path = require('path');

// Read the .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract API key
const apiKeyMatch = envContent.match(/PERPLEXITY_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

console.log('API Key found:', apiKey ? 'Yes' : 'No');
console.log('API Key starts with pplx-:', apiKey ? apiKey.startsWith('pplx-') : 'No key');
console.log('API Key length:', apiKey ? apiKey.length : 0);

if (!apiKey || apiKey === 'your_perplexity_api_key_here') {
  console.log('\n❌ ERROR: Please update your API key in backend/.env');
  console.log('Get your API key from: https://www.perplexity.ai/settings/api');
  console.log('Format should be: PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
} else if (!apiKey.startsWith('pplx-')) {
  console.log('\n❌ ERROR: API key format is incorrect');
  console.log('API key should start with "pplx-"');
} else {
  console.log('\n✅ API key format looks correct');
} 