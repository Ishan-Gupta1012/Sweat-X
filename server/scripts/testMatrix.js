/**
 * Script to test all 5 Gemini API keys with multiple models
 */
require('dotenv').config({ path: './.env' });

async function testAll() {
    const keys = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
        process.env.GEMINI_API_KEY_5
    ];

    const models = ['gemini-2.0-flash', 'gemini-3-flash-preview', 'gemini-1.5-flash', 'gemini-flash-latest'];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const label = `Key ${i + 1}`;
        if (!key) continue;

        console.log(`\n--- Testing ${label} ---`);
        for (const model of models) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] }),
                });

                if (response.ok) {
                    console.log(`[${model}] - ✅ OK`);
                } else {
                    const err = await response.json();
                    console.log(`[${model}] - ❌ ${err.error?.message || response.statusText}`);
                }
            } catch (e) {
                console.log(`[${model}] - ❌ ERROR`);
            }
        }
    }
}

testAll().catch(console.error);
