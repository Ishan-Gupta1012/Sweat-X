const express = require('express');
const router = express.Router();
const ExerciseCalorie = require('../models/ExerciseCalorie');

const { generateContent } = require('../services/aiService');

// Call Gemini API using centralized AI service
const callGemini = async (prompt) => {
    try {
        const responseText = await generateContent(prompt, 0.1, 50);
        const number = parseFloat(responseText.replace(/[^0-9.]/g, ''));
        return isNaN(number) ? null : number;
    } catch (error) {
        console.error('Gemini call failed in calories route:', error.message);
        return null; // Return null to trigger fallbacks
    }
};

// Calculate calories for a single exercise (with caching)
router.post('/exercise', async (req, res) => {
    try {
        const { exerciseName, weight, reps } = req.body;

        if (!exerciseName || !weight) {
            return res.status(400).json({ success: false, error: 'Missing exerciseName or weight' });
        }

        // Check cache first
        let caloriesPerRep = await ExerciseCalorie.getCachedCalories(exerciseName, weight);
        let fromCache = true;

        if (caloriesPerRep === null) {
            // Not in cache, call Gemini API
            fromCache = false;
            const prompt = `Calculate calories burned for 1 rep of "${exerciseName}" with ${weight}kg weight. Consider muscle groups worked, form, and energy expenditure. Respond with ONLY a decimal number (e.g., 0.5). No explanation.`;

            caloriesPerRep = await callGemini(prompt);

            if (caloriesPerRep !== null) {
                // Cache the result
                await ExerciseCalorie.cacheCalories(exerciseName, weight, caloriesPerRep);
                console.log(`✅ Cached: ${exerciseName} @ ${weight}kg = ${caloriesPerRep} cal/rep`);
            } else {
                // Fallback estimate: 0.1-0.5 cal per rep based on weight
                caloriesPerRep = Math.max(0.1, weight * 0.01);
            }
        }

        const totalCalories = Math.round(caloriesPerRep * (reps || 1));

        res.json({
            success: true,
            exerciseName,
            weight,
            reps: reps || 1,
            caloriesPerRep,
            totalCalories,
            fromCache,
        });
    } catch (error) {
        console.error('Error calculating exercise calories:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Calculate calories for a complete workout
router.post('/workout', async (req, res) => {
    try {
        const { exercises, cardio, userWeight } = req.body;
        let totalCalories = 0;
        const breakdown = [];

        // MET values for cardio lookup
        const metValues = {
            'walking': { light: 2.5, moderate: 3.5, intense: 5.0 },
            'running': { light: 6.0, moderate: 9.0, intense: 12.0 },
            'cycling': { light: 4.0, moderate: 7.0, intense: 10.0 },
            'swimming': { light: 5.0, moderate: 8.0, intense: 11.0 },
            'jump rope': { light: 8.0, moderate: 11.0, intense: 14.0 },
            'jump_rope': { light: 8.0, moderate: 11.0, intense: 14.0 },
            'hiit': { light: 7.0, moderate: 10.0, intense: 14.0 },
            'elliptical': { light: 4.0, moderate: 5.0, intense: 7.0 },
            'rowing': { light: 5.0, moderate: 7.0, intense: 10.0 },
            'stationary bike': { light: 4.0, moderate: 6.0, intense: 9.0 },
            'treadmill': { light: 3.5, moderate: 7.5, intense: 10.0 },
        };

        // Calculate exercise calories
        for (const exercise of exercises || []) {
            let exerciseTotal = 0;
            const lowerName = exercise.name.toLowerCase();

            for (const set of exercise.sets || []) {
                const weight = set.weight || 0;
                const reps = set.reps || 0;
                const time = set.time || 0;
                const intensityRaw = (set.intensity || 'moderate').toLowerCase();
                const intensity = intensityRaw.startsWith('low') ? 'light' :
                    intensityRaw.startsWith('high') ? 'intense' : 'moderate';
                const isCardio = time > 0 || Object.keys(metValues).some(k => lowerName.includes(k)) || exercise.category === 'cardio';

                if (isCardio && (time > 0 || reps > 0)) {
                    // Cardio Exercise check
                    const cardioMatch = Object.keys(metValues).find(k => lowerName.includes(k)) || 'elliptical';
                    const metConfig = metValues[cardioMatch];
                    const met = metConfig[intensity] || metConfig.moderate;

                    // If no time is provided but reps are, estimate time based on reps (e.g., 2 seconds per rep = 1/30 min per rep)
                    let estimatedTimeMins = time > 0 ? time : (reps * 2 / 60);

                    const hours = estimatedTimeMins / 60;
                    const w = userWeight || 70;
                    exerciseTotal += (met * w * hours);
                } else if (reps > 0) {
                    // Strength Exercise (or bodyweight exercise if weight is 0)
                    const effectiveWeight = weight > 0 ? weight : (userWeight || 70); // Use entered weight or assume body weight if 0

                    let calPerRep = await ExerciseCalorie.getCachedCalories(exercise.name, effectiveWeight);
                    if (calPerRep === null) {
                        // Base calculation: roughly 0.3 to 0.5 cals per rep for average bodyweight movements (like crunches or pushups)
                        calPerRep = Math.max(0.3, effectiveWeight * 0.005);
                    }
                    exerciseTotal += calPerRep * reps;
                }
            }

            breakdown.push({
                name: exercise.name,
                calories: Math.round(exerciseTotal),
            });
            totalCalories += exerciseTotal;
        }

        // Calculate cardio calories
        if (cardio && cardio.type && cardio.duration) {
            const metValues = {
                'walking': { light: 2.5, moderate: 3.5, intense: 5.0 },
                'running': { light: 6.0, moderate: 9.0, intense: 12.0 },
                'cycling': { light: 4.0, moderate: 7.0, intense: 10.0 },
                'swimming': { light: 5.0, moderate: 8.0, intense: 11.0 },
                'jump rope': { light: 8.0, moderate: 11.0, intense: 14.0 },
                'jump_rope': { light: 8.0, moderate: 11.0, intense: 14.0 },
                'hiit': { light: 7.0, moderate: 10.0, intense: 14.0 },
                'elliptical': { light: 4.0, moderate: 5.0, intense: 7.0 },
                'rowing': { light: 5.0, moderate: 7.0, intense: 10.0 },
            };

            const cardioType = cardio.type.toLowerCase();
            const intensity = cardio.intensity || 'moderate';
            const metConfig = metValues[cardioType] || { light: 4.0, moderate: 5.0, intense: 7.0 };
            const met = metConfig[intensity] || metConfig.moderate;
            const hours = cardio.duration / 60;
            const weight = userWeight || 70;
            const cardioCalories = Math.round(met * weight * hours);

            console.log(`📊 Cardio: ${cardio.type} (${intensity}) for ${cardio.duration} min @ ${weight}kg = MET ${met} = ${cardioCalories} kcal`);

            breakdown.push({
                name: `Cardio: ${cardio.type}`,
                calories: cardioCalories,
            });
            totalCalories += cardioCalories;
        }

        res.json({
            success: true,
            totalCalories: Math.round(totalCalories) || 0,
            breakdown,
            exerciseMinutes: exercises?.length * 3 || 0, // Rough estimate
            cardioMinutes: cardio?.duration || 0,
        });
    } catch (error) {
        console.error('Error calculating workout calories:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get cached exercise data
router.get('/cache/:exerciseName', async (req, res) => {
    try {
        const { exerciseName } = req.params;
        const entries = await ExerciseCalorie.find({
            exerciseName: exerciseName.toLowerCase().trim()
        }).sort({ weight: 1 });

        res.json({ success: true, entries });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Calculate calories for a food item
router.post('/food', async (req, res) => {
    try {
        const { foodName, quantity } = req.body;

        if (!foodName) {
            return res.status(400).json({ success: false, error: 'Missing foodName' });
        }

        // More detailed prompt for accurate calorie calculation
        const prompt = `You are a nutrition expert. Calculate the exact calories for "${quantity || '100g'}" of "${foodName}".

Use these standard reference values:
- Rice (cooked): 130 kcal per 100g
- Chapati/Roti: 70-80 kcal per piece
- Dal (cooked): 100-120 kcal per 100g
- Chicken breast: 165 kcal per 100g
- Egg: 70-80 kcal per egg
- Paneer: 265 kcal per 100g
- Milk (full fat): 60 kcal per 100ml
- Banana: 90 kcal per piece
- Apple: 52 kcal per 100g
- Bread: 75 kcal per slice
- Butter: 102 kcal per 1 tablespoon

For Indian portions:
- 1 bowl = approximately 150-200g
- 1 katori = approximately 100-150g
- 1 plate = approximately 200-250g

Respond with ONLY a single integer number representing calories. No text, no explanation.`;

        let calories = await callGemini(prompt);

        if (calories === null || calories < 5 || calories > 2000) {
            // More accurate fallback estimates based on food type
            const lowerFood = foodName.toLowerCase();
            const qty = quantity?.toLowerCase() || '100g';

            // Base calorie estimates per 100g or standard portion
            let baseCal = 100;

            if (lowerFood.includes('rice')) baseCal = 130;
            else if (lowerFood.includes('roti') || lowerFood.includes('chapati')) baseCal = 75;
            else if (lowerFood.includes('dal') || lowerFood.includes('lentil')) baseCal = 110;
            else if (lowerFood.includes('chicken')) baseCal = 165;
            else if (lowerFood.includes('egg')) baseCal = 75;
            else if (lowerFood.includes('paneer')) baseCal = 265;
            else if (lowerFood.includes('milk')) baseCal = 60;
            else if (lowerFood.includes('bread')) baseCal = 75;
            else if (lowerFood.includes('banana')) baseCal = 90;
            else if (lowerFood.includes('apple')) baseCal = 52;
            else if (lowerFood.includes('sabzi') || lowerFood.includes('vegetable')) baseCal = 80;
            else if (lowerFood.includes('butter') || lowerFood.includes('ghee')) baseCal = 100;
            else if (lowerFood.includes('oil')) baseCal = 120;
            else if (lowerFood.includes('sugar')) baseCal = 40;
            else if (lowerFood.includes('fruit')) baseCal = 50;
            else if (lowerFood.includes('salad')) baseCal = 30;
            else if (lowerFood.includes('tea') || lowerFood.includes('coffee')) baseCal = 20;
            else if (lowerFood.includes('juice')) baseCal = 45;

            // Adjust for quantity
            let multiplier = 1;
            if (qty.includes('bowl')) multiplier = 1.75;
            else if (qty.includes('plate')) multiplier = 2.5;
            else if (qty.includes('katori')) multiplier = 1.25;
            else if (qty.includes('cup')) multiplier = 1.5;
            else if (qty.includes('spoon') || qty.includes('tbsp')) multiplier = 0.15;
            else if (qty.includes('piece')) multiplier = 1;

            calories = Math.round(baseCal * multiplier);
        }

        console.log(`🍽️ Food: ${foodName} (${quantity}) = ${calories} kcal`);

        res.json({
            success: true,
            foodName,
            quantity,
            calories: Math.round(calories),
        });
    } catch (error) {
        console.error('Error calculating food calories:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
