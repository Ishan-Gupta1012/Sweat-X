require('dotenv').config();
const { getNextKey } = require('./utils/keyRotation');
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const test = async () => {
    const q = 'moong dal pakodi';
    const prompt = `Act as a professional Indian nutritionist. The user input is "${q}". 
    It might contain spelling errors or typos. Identify the intended food item, correct the spelling, and provide nutritional data per 100g.
    Respond ONLY with a JSON object in this exact format:
    {
      "name": "Standard Name",
      "nameHindi": "Hindi Name",
      "category": "one of: breakfast, lunch, dinner, snack, beverage, dessert, staple",
      "caloriesPer100g": 150,
      "proteinPer100g": 5,
      "carbsPer100g": 20,
      "fatsPer100g": 5,
      "fiberPer100g": 3,
      "servingSizes": { "bowl": 250, "katori": 150, "plate": 300, "piece": 50 },
      "isVegetarian": true
    }`;
    
    const apiKey = getNextKey();
    const response = await fetch(`${GEMINI_API_BASE_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 1000,
                    }
                }),
            });
    const data = await response.json();
    console.dir(data, { depth: null });
};
test();
