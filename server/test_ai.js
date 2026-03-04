const { generateContent } = require('./services/aiService');

const fetchNutritionFromAI = async (query) => {
    const prompt = `Act as a professional Indian nutritionist. The user input is "${query}". 
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

    try {
        const text = await generateContent(prompt, 0.1, 1000);
        console.log("Raw text from AI:", text);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
        console.error('AI Fetch Error:', error.message);
        return null;
    }
};

fetchNutritionFromAI("moong dal pakodi").then(res => console.log("Parsed result:", res)).catch(console.error);
