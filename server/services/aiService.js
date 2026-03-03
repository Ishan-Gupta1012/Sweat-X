const { getNextKey, getKeyCount } = require('../utils/keyRotation');

// The base URL without the key
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Helper: delay for a given number of milliseconds
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Call Gemini API with a prompt (using key rotation + retry on 429)
 */
const generateContent = async (prompt, temperature = 0.7, maxTokens = 400) => {
    const maxRetries = getKeyCount();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
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

            // If rate limited, try next key after a short delay
            if (response.status === 429) {
                console.warn(`⚠️ Key ${attempt + 1}/${maxRetries} rate limited, trying next key...`);
                await delay(500);
                continue;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Gemini API error (${response.status}):`, errorText);
                throw new Error(`AI service error (${response.status})`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (error) {
            // Only throw if it's not a rate limit retry
            if (attempt === maxRetries - 1 || !error.message?.includes('429')) {
                console.error('❌ generateContent Error:', error.message);
                throw error;
            }
        }
    }

    throw new Error('AI service error (429): All API keys are rate limited. Please try again in a minute.');
};

/**
 * Call Gemini Vision API for image analysis (using key rotation + retry on 429)
 */
const generateImageAnalysis = async (prompt, imageBase64, mimeType = "image/jpeg", maxTokens = 1000) => {
    const maxRetries = getKeyCount();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
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

            // If rate limited, try next key after a short delay
            if (response.status === 429) {
                console.warn(`⚠️ Vision Key ${attempt + 1}/${maxRetries} rate limited, trying next key...`);
                await delay(500);
                continue;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Gemini Vision API error (${response.status}):`, errorText);
                throw new Error(`AI vision service error (${response.status})`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (error) {
            if (attempt === maxRetries - 1 || !error.message?.includes('429')) {
                console.error('❌ generateImageAnalysis Error:', error.message);
                throw error;
            }
        }
    }

    throw new Error('AI vision service error (429): All API keys are rate limited. Please try again in a minute.');
};

module.exports = {
    generateContent,
    generateImageAnalysis
};
