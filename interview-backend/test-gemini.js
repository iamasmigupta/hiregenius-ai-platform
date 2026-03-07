require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 12) : 'MISSING');
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('Sending test prompt to Gemini...');
        const result = await model.generateContent('Reply with exactly: {"status":"ok"}');
        const text = result.response.text();
        console.log('SUCCESS! Response:', text.substring(0, 200));
    } catch (e) {
        console.log('ERROR name:', e.name);
        console.log('ERROR message:', e.message);
        console.log('ERROR status:', e.status);
        console.log('ERROR details:', JSON.stringify(e.errorDetails || e.details || {}, null, 2));
    }
}

test();
