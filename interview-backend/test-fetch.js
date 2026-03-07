require('dotenv').config();

async function testFetch() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say ok" }] }]
            })
        });
        
        const data = await response.json();
        console.log('STATUS:', response.status);
        console.log('RESPONSE:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('FETCH ERROR:', err.message);
    }
}

testFetch();
