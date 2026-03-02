/**
 * Final verification of Gemini API connectivity
 */
require('dotenv').config({ path: './.env' });
const { getNextKey, getKeyCount } = require('../utils/keyRotation');

async function verify() {
    console.log(`📊 Testing rotation with ${getKeyCount()} keys...`);
    const model = 'gemini-flash-latest';

    for (let i = 0; i < getKeyCount(); i++) {
        const apiKey = getNextKey();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] }),
            });
            if (response.ok) {
                console.log(`[Key ${i + 1}] - ✅ OK`);
            } else {
                const err = await response.json();
                console.log(`[Key ${i + 1}] - ❌ ${err.error?.message || response.statusText}`);
            }
        } catch (e) {
            console.log(`[Key ${i + 1}] - ❌ ERROR`);
        }
    }
}

verify().catch(console.error);
