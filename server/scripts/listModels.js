/**
 * Script to list available models for Key 2
 */
require('dotenv').config({ path: './.env' });

async function listModels() {
    const key = process.env.GEMINI_API_KEY_2;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('❌ Error listing models:', e.message);
    }
}

listModels().catch(console.error);
