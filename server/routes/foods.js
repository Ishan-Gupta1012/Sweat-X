const express = require('express');
const router = express.Router();
const Food = require('../models/Food');

const { generateContent, generateImageAnalysis } = require('../services/aiService');

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
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
        console.error('AI Fetch Error:', error.message);
        return null;
    }
};

// Search foods
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 20, cuisine, category, vegetarian } = req.query;

        if (!q || q.length < 2) {
            return res.json([]);
        }

        const regex = new RegExp(q, 'i');
        let query = {
            $or: [
                { name: regex },
                { nameHindi: regex },
                { keywords: regex },
            ]
        };

        // Apply filters
        if (cuisine) query.cuisine = cuisine;
        if (category) query.category = category;
        if (vegetarian === 'true') query.isVegetarian = true;

        let foods = await Food.find(query)
            .sort({ popularity: -1 })
            .limit(parseInt(limit))
            .select('name nameHindi category cuisine isVegetarian caloriesPer100g proteinPer100g carbsPer100g fatsPer100g fiberPer100g defaultServing servingSizes');

        // AUTO-GROW: If not found, ask Bon Happetee or AI and save it
        if (foods.length === 0 && q.length >= 3) {
            console.log(`Auto-growing database for: ${q}`);

            // Use Gemini for auto-grow
            const aiData = await fetchNutritionFromAI(q);

            if (aiData && (aiData.caloriesPer100g || aiData.calories)) {
                try {
                    console.log('Saving AI data to DB...');
                    const calories = aiData.caloriesPer100g || aiData.calories;
                    const protein = aiData.proteinPer100g || aiData.protein;
                    const carbs = aiData.carbsPer100g || aiData.carbs;
                    const fats = aiData.fatsPer100g || aiData.fats;

                    // Normalize category to match schema enum
                    const validCategories = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'dessert', 'staple'];
                    let category = (aiData.category || 'lunch').toLowerCase().trim();

                    if (!validCategories.includes(category)) {
                        if (category.includes('lunch') || category.includes('dinner')) category = 'lunch';
                        else if (category.includes('snack')) category = 'snack';
                        else if (category.includes('breakfast')) category = 'breakfast';
                        else if (category.includes('drink') || category.includes('beverage')) category = 'beverage';
                        else category = 'lunch';
                    }

                    const newFood = new Food({
                        name: aiData.name,
                        nameHindi: aiData.nameHindi || '',
                        category: category,
                        cuisine: 'indian',
                        caloriesPer100g: calories,
                        proteinPer100g: protein || 0,
                        carbsPer100g: carbs || 0,
                        fatsPer100g: fats || 0,
                        fiberPer100g: aiData.fiberPer100g || aiData.fiber || 0,
                        servingSizes: aiData.servingSizes || { bowl: 250, katori: 150 },
                        isVegetarian: aiData.isVegetarian !== undefined ? aiData.isVegetarian : true,
                        keywords: [aiData.name.toLowerCase(), q.toLowerCase()]
                    });
                    const savedFood = await newFood.save();
                    console.log(`✅ Auto-Grow Success: ${savedFood.name} added to DB.`);
                    foods = [savedFood];
                } catch (saveError) {
                    console.error('Failed to auto-save AI food:', saveError);
                }
            } else {
                console.log('AI returned invalid or empty data for:', q);
            }
        }

        res.json(foods);
    } catch (error) {
        console.error('Error searching foods:', error);
        res.status(500).json({ error: 'Failed to search foods' });
    }
});

// Get popular foods
router.get('/popular', async (req, res) => {
    try {
        const { limit = 10, category } = req.query;

        let query = {};
        if (category) query.category = category;

        const foods = await Food.find(query)
            .sort({ popularity: -1 })
            .limit(parseInt(limit))
            .select('name nameHindi category cuisine isVegetarian caloriesPer100g proteinPer100g carbsPer100g fatsPer100g fiberPer100g defaultServing servingSizes');

        res.json(foods);
    } catch (error) {
        console.error('Error getting popular foods:', error);
        res.status(500).json({ error: 'Failed to get popular foods' });
    }
});

// Get food by ID
router.get('/:id', async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        res.json(food);
    } catch (error) {
        console.error('Error getting food:', error);
        res.status(500).json({ error: 'Failed to get food' });
    }
});

// Calculate nutrition for a food
router.post('/calculate', async (req, res) => {
    try {
        const { foodId, servingType, quantity } = req.body;

        const food = await Food.findById(foodId);
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }

        const nutrition = food.calculateNutrition(servingType, quantity);
        res.json({
            food: {
                id: food._id,
                name: food.name,
                nameHindi: food.nameHindi,
            },
            servingType,
            quantity,
            nutrition,
        });
    } catch (error) {
        console.error('Error calculating nutrition:', error);
        res.status(500).json({ error: 'Failed to calculate nutrition' });
    }
});

// Get all categories
router.get('/meta/categories', async (req, res) => {
    try {
        const categories = await Food.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Get all cuisines
router.get('/meta/cuisines', async (req, res) => {
    try {
        const cuisines = await Food.distinct('cuisine');
        res.json(cuisines);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get cuisines' });
    }
});

// AI Food Recognition from Image
router.post('/analyze-image', express.json({ limit: '100mb' }), async (req, res) => {
    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ success: false, error: 'Missing image data' });
        }

        // USE PURE GEMINI ANALYSIS (No RapidAPI/Bon Happetee)
        const prompt = `Act as a professional nutritionist and AI food analyst. Analyze this image of food. 
1. Identify the food items present.
2. Estimate the serving size for each item (e.g., 1 bowl of rice, 2 rotis, 150g chicken).
3. Provide the total nutritional breakdown for the entire meal shown in the image.

Respond ONLY with a JSON object in this exact format, with no extra text or markdown:
{
  "name": "Detailed name of the meal",
  "quantity": "Estimated total quantity",
  "calories": 450,
  "protein": 30,
  "carbs": 50,
  "fats": 15,
  "isVegetarian": true,
  "confidence": 0.95
}`;

        const text = await generateImageAnalysis(prompt, imageBase64);

        try {
            // Robust JSON extraction
            const startIdx = text.indexOf('{');
            const endIdx = text.lastIndexOf('}');

            if (startIdx === -1 || endIdx === -1) {
                console.error('❌ AI response missing JSON:', text);
                return res.status(500).json({ success: false, error: 'AI returned invalid data' });
            }

            const jsonStr = text.substring(startIdx, endIdx + 1);
            const analysis = JSON.parse(jsonStr);

            res.json({
                success: true,
                analysis
            });
        } catch (parseError) {
            console.error('❌ AI Response Parse Error:', parseError.message);
            console.error('Raw AI Content:', text);
            res.status(500).json({ success: false, error: 'Failed to parse AI response' });
        }

    } catch (error) {
        console.error('Error in AI food analysis:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
