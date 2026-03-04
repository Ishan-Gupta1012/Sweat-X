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
        const text = await generateContent(prompt, 0.1, 8192);
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
        const { imageBase64, mimeType: clientMimeType } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ success: false, error: 'Missing image data' });
        }

        console.log("Analyzing image, base64 starts with:", imageBase64.substring(0, 50));

        // Strip data:image/...;base64, if present
        let cleanBase64 = imageBase64;
        let mimeType = clientMimeType || 'image/jpeg';
        if (imageBase64.startsWith('data:')) {
            const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                cleanBase64 = matches[2];
            }
        }

        // USE PURE GEMINI ANALYSIS (No RapidAPI/Bon Happetee)
        const prompt = `You are an expert Indian and international food nutritionist with deep knowledge of all cuisines including Indian dishes like vermicelli (sewaiyan/sevai), poha, upma, khichdi, dal, sabzi, roti, paratha, biryani, pulao, dosa, idli, etc.

Analyze this food image carefully. You MUST try your best to identify the food. Even if the image is slightly blurry or the food is uncommon, make your best educated guess. Do NOT say you cannot identify — always attempt.

ONLY return this JSON if you are absolutely certain the image contains NO food at all (e.g., a phone, a car, a person without food):
{"error": "No food detected in this image."}

For ANY image that contains food or drink (even partially visible), respond with this JSON:
{
  "name": "Detailed name of the meal (use common Indian/English name)",
  "quantity": "Estimated total quantity (e.g., 1 bowl, 2 rotis, 150g)",
  "calories": 450,
  "protein": 30,
  "carbs": 50,
  "fats": 15,
  "fiber": 3,
  "isVegetarian": true,
  "confidence": 0.85
}

Rules:
- ALWAYS respond with valid JSON only, no markdown, no extra text
- Use realistic Indian nutritional values
- If multiple food items are visible, combine them into one total
- Never refuse to identify food — make your best guess`;

        const text = await generateImageAnalysis(prompt, cleanBase64, mimeType);

        try {
            // Robust JSON extraction
            const startIdx = text.indexOf('{');
            const endIdx = text.lastIndexOf('}');

            if (startIdx === -1 || endIdx === -1) {
                console.error('❌ AI response missing JSON:', text);
                return res.status(200).json({ success: false, error: 'Could not recognize food in this image.' });
            }

            const jsonStr = text.substring(startIdx, endIdx + 1);
            const analysis = JSON.parse(jsonStr);

            if (analysis.error) {
                return res.status(200).json({ success: false, error: analysis.error });
            }

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
