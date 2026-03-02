const { getNextKey } = require('../utils/keyRotation');

// The base URL without the key
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

/**
 * Call Gemini API with a prompt (using key rotation)
 */
const generateContent = async (prompt, temperature = 0.7, maxTokens = 400) => {
    const apiKey = getNextKey();

    if (!apiKey) {
        throw new Error('AI service unavailable: No API keys configured.');
    }

    try {
        const response = await fetch(`${GEMINI_API_BASE_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: maxTokens,
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Gemini API error (${response.status}):`, errorText);
            throw new Error(`AI service error (${response.status})`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
        console.error('❌ generateContent Error:', error.message);
        throw error;
    }
};

/**
 * Call Gemini Vision API for image analysis (using key rotation)
 */
const generateImageAnalysis = async (prompt, imageBase64, mimeType = "image/jpeg", maxTokens = 1000) => {
    const apiKey = getNextKey();

    if (!apiKey) {
        throw new Error('AI service unavailable: No API keys configured.');
    }

    try {
        const response = await fetch(`${GEMINI_API_BASE_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: mimeType, data: imageBase64 } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: maxTokens
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Gemini Vision API error (${response.status}):`, errorText);
            throw new Error(`AI vision service error (${response.status})`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
        console.error('❌ generateImageAnalysis Error:', error.message);
        throw error;
    }
};

module.exports = {
    generateContent,
    generateImageAnalysis
};
