const express = require('express');
const router = express.Router();
const { generateContent } = require('../services/aiService');

/**
 * AI Coaching Chat Proxy
 * POST /api/ai/chat
 */
router.post('/chat', async (req, res) => {
    try {
        const { prompt, temperature, maxTokens } = req.body;

        if (!prompt) {
            console.warn('⚠️ AI chat request missing prompt');
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        console.log(`🤖 AI Chat request received (${prompt.substring(0, 50)}...)`);

        const responseText = await generateContent(prompt, temperature || 0.7, maxTokens || 400);

        console.log('✅ AI Chat response generated successfully');
        res.json({
            success: true,
            text: responseText
        });
    } catch (error) {
        console.error('❌ AI Chat Error:', error.message);

        // Return the actual error message to help with debugging
        const errorMessage = error.message || 'AI processing failed';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

/**
 * AI Calculation Proxy (returns number)
 * POST /api/ai/calculate
 */
router.post('/calculate', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        const responseText = await generateContent(prompt, 0.1, 50);

        // Extract number from response (logic cloned from frontend gemini.js)
        const number = parseFloat(responseText.replace(/[^0-9.]/g, ''));

        if (isNaN(number)) {
            return res.status(500).json({ success: false, error: 'Failed to parse numeric response from AI' });
        }

        res.json({
            success: true,
            number: Math.round(number)
        });
    } catch (error) {
        console.error('AI Calculation Routing Error:', error);
        res.status(500).json({ success: false, error: 'AI calculation failed' });
    }
});

module.exports = router;
