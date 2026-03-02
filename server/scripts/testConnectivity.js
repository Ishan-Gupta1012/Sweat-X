/**
 * Script to verify Gemini API connectivity with a real request
 */
require('dotenv').config({ path: './.env' });
const { getNextKey, getKeyCount } = require('../utils/keyRotation');

async function testConnectivity() {
    console.log(`📊 Total keys configured: ${getKeyCount()}`);
    const apiKey = getNextKey();

    if (!apiKey) {
        console.error('❌ No keys found!');
        return;
    }

    // Testing with gemini-1.5-flash (stable)
    const MODEL = 'gemini-1.5-flash';
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    console.log(`\n--- Testing ${MODEL} ---`);
    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello, reply with only the word 'OK' if you see this." }] }]
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`❌ API Error (${response.status}):`, err);
        } else {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log(`✅ Success! Response: ${text.trim()}`);
        }
    } catch (e) {
        console.error('❌ Request failed:', e.message);
    }
}

testConnectivity().catch(console.error);
