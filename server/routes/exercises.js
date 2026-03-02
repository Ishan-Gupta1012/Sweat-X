const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');

// Get all exercises
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;

        let query = {};
        if (category) {
            query.category = category.toLowerCase();
        }

        const exercises = await Exercise.find(query).sort({ name: 1 });
        res.json({ success: true, exercises, count: exercises.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get exercises by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const exercises = await Exercise.find({
            category: category.toLowerCase()
        }).sort({ name: 1 });

        res.json({ success: true, exercises, count: exercises.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all categories with exercise counts
router.get('/categories', async (req, res) => {
    try {
        const categories = await Exercise.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search exercises by name
router.get('/search/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const exercises = await Exercise.find({
            name: { $regex: name.toLowerCase(), $options: 'i' }
        }).limit(20);

        res.json({ success: true, exercises, count: exercises.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Recommend exercises for a workout day (beginner-focused)
router.post('/recommend', async (req, res) => {
    try {
        const { zones, level = 'beginner', limit = 6 } = req.body;

        if (!zones || !Array.isArray(zones) || zones.length === 0) {
            return res.status(400).json({ success: false, error: 'zones array required' });
        }

        const allExercises = [];
        const exercisesPerZone = Math.ceil(limit / zones.length);

        for (const zone of zones) {
            // Map common zone names to exercise categories
            let category = zone.toLowerCase();
            if (category === 'abs') category = 'core';
            if (category === 'arms') {
                // For 'arms', get both biceps and triceps
                const bicepExercises = await Exercise.find({ category: 'biceps' }).limit(10);
                const tricepExercises = await Exercise.find({ category: 'triceps' }).limit(10);
                const armExercises = [...bicepExercises, ...tricepExercises];

                // Sort: compound first for beginners, then isolation
                armExercises.sort((a, b) => {
                    if (a.type === 'compound' && b.type !== 'compound') return -1;
                    if (a.type !== 'compound' && b.type === 'compound') return 1;
                    return 0;
                });

                // Shuffle within priority groups for variety
                const shuffled = armExercises.sort(() => Math.random() - 0.5);
                allExercises.push(...shuffled.slice(0, exercisesPerZone));
                continue;
            }

            // Fetch exercises for this category
            let categoryExercises = await Exercise.find({ category }).limit(20);

            if (categoryExercises.length === 0) {
                // Try alternate mappings
                if (category === 'chest') categoryExercises = await Exercise.find({ category: 'chest' }).limit(20);
                else if (category === 'back') categoryExercises = await Exercise.find({ category: 'back' }).limit(20);
            }

            // Sort: compound exercises first for beginners
            categoryExercises.sort((a, b) => {
                if (a.type === 'compound' && b.type !== 'compound') return -1;
                if (a.type !== 'compound' && b.type === 'compound') return 1;
                return 0;
            });

            // Shuffle for variety while keeping compound priority
            const compounds = categoryExercises.filter(e => e.type === 'compound');
            const isolations = categoryExercises.filter(e => e.type !== 'compound');

            // Shuffle each group
            compounds.sort(() => Math.random() - 0.5);
            isolations.sort(() => Math.random() - 0.5);

            // Take mostly compounds for beginners
            const compoundCount = Math.ceil(exercisesPerZone * 0.7);
            const isolationCount = exercisesPerZone - compoundCount;

            const selected = [
                ...compounds.slice(0, compoundCount),
                ...isolations.slice(0, isolationCount)
            ];

            allExercises.push(...selected);
        }

        // Remove duplicates and limit to requested count
        const uniqueExercises = [];
        const seenNames = new Set();
        for (const ex of allExercises) {
            if (!seenNames.has(ex.name)) {
                seenNames.add(ex.name);
                uniqueExercises.push({
                    name: ex.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    category: ex.category,
                    type: ex.type,
                    sets: level === 'beginner' ? 3 : 4,
                    reps: level === 'beginner' ? '8-12' : '6-10'
                });
            }
            if (uniqueExercises.length >= limit) break;
        }

        res.json({
            success: true,
            exercises: uniqueExercises,
            count: uniqueExercises.length,
            zones,
            level
        });
    } catch (error) {
        console.error('Recommend error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generate a complete workout routine based on time available
// POST /api/exercises/routine
router.post('/routine', async (req, res) => {
    try {
        const { zones, time = 60, level = 'beginner' } = req.body;

        if (!zones || !Array.isArray(zones) || zones.length === 0) {
            return res.status(400).json({ success: false, error: 'zones array required' });
        }

        // Calculate exercise count based on time
        // ~8-10 min per exercise (including rest)
        let exerciseCount;
        if (time <= 30) exerciseCount = 4;
        else if (time <= 45) exerciseCount = 5;
        else if (time <= 60) exerciseCount = 7;
        else exerciseCount = 9;

        // Priority order for exercises within each zone
        const priorityExercises = {
            chest: ['bench press', 'incline bench press', 'dumbbell press', 'incline dumbbell press', 'dips', 'cable fly', 'pec deck'],
            back: ['deadlift', 'barbell row', 'lat pulldown', 'cable row', 'dumbbell row', 't bar row', 'face pull'],
            shoulders: ['overhead press', 'dumbbell shoulder press', 'arnold press', 'lateral raise', 'front raise', 'rear delt fly'],
            legs: ['squat', 'leg press', 'romanian deadlift', 'lunge', 'leg extension', 'leg curl', 'calf raise'],
            biceps: ['barbell curl', 'dumbbell curl', 'hammer curl', 'preacher curl', 'cable curl'],
            triceps: ['tricep pushdown', 'skull crusher', 'overhead tricep extension', 'close grip bench press', 'tricep dip'],
            abs: ['hanging leg raise', 'cable crunch', 'plank', 'russian twist', 'crunch'],
            core: ['hanging leg raise', 'cable crunch', 'plank', 'russian twist', 'ab wheel rollout']
        };

        // Distribute exercises across zones based on priority
        const routine = [];
        const exercisesPerZone = Math.ceil(exerciseCount / zones.length);
        const seenNames = new Set();

        for (const zone of zones) {
            const zonePriorities = priorityExercises[zone.toLowerCase()] || [];
            let zoneCategory = zone.toLowerCase();
            if (zoneCategory === 'abs') zoneCategory = 'core';
            if (zoneCategory === 'arms') {
                // Handle arms as biceps + triceps
                const biceps = await Exercise.find({ category: 'biceps' }).limit(3);
                const triceps = await Exercise.find({ category: 'triceps' }).limit(3);
                const armExercises = [...biceps, ...triceps];

                for (const ex of armExercises) {
                    if (!seenNames.has(ex.name) && routine.length < exerciseCount) {
                        seenNames.add(ex.name);
                        routine.push({
                            name: ex.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                            category: ex.category,
                            type: ex.type,
                            sets: level === 'beginner' ? 3 : 4,
                            reps: ex.type === 'compound' ? (level === 'beginner' ? '8-10' : '6-8') : '10-15',
                            priority: zonePriorities.indexOf(ex.name) !== -1 ? zonePriorities.indexOf(ex.name) + 1 : 99,
                            restSeconds: ex.type === 'compound' ? 90 : 60
                        });
                    }
                }
                continue;
            }

            // Fetch exercises for this zone
            const zoneExercises = await Exercise.find({ category: zoneCategory }).limit(15);

            // Sort by priority
            zoneExercises.sort((a, b) => {
                const aPriority = zonePriorities.indexOf(a.name);
                const bPriority = zonePriorities.indexOf(b.name);
                // Compound first, then by priority list
                if (a.type === 'compound' && b.type !== 'compound') return -1;
                if (a.type !== 'compound' && b.type === 'compound') return 1;
                if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
                if (aPriority !== -1) return -1;
                if (bPriority !== -1) return 1;
                return 0;
            });

            // Add to routine
            let zoneCount = 0;
            for (const ex of zoneExercises) {
                if (zoneCount >= exercisesPerZone) break;
                if (seenNames.has(ex.name)) continue;
                if (routine.length >= exerciseCount) break;

                seenNames.add(ex.name);
                routine.push({
                    name: ex.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    category: ex.category,
                    type: ex.type,
                    sets: level === 'beginner' ? 3 : 4,
                    reps: ex.type === 'compound' ? (level === 'beginner' ? '8-10' : '6-8') : '10-15',
                    priority: zonePriorities.indexOf(ex.name) !== -1 ? zonePriorities.indexOf(ex.name) + 1 : 99,
                    restSeconds: ex.type === 'compound' ? 90 : 60
                });
                zoneCount++;
            }
        }

        // Sort final routine: compounds first, then by priority
        routine.sort((a, b) => {
            if (a.type === 'compound' && b.type !== 'compound') return -1;
            if (a.type !== 'compound' && b.type === 'compound') return 1;
            return a.priority - b.priority;
        });

        // Calculate estimated workout time
        const estimatedTime = routine.reduce((total, ex) => {
            const setTime = 45; // seconds per set
            const restTime = ex.restSeconds;
            return total + (ex.sets * setTime) + ((ex.sets - 1) * restTime);
        }, 0);

        res.json({
            success: true,
            routine,
            count: routine.length,
            zones,
            time,
            level,
            estimatedMinutes: Math.round(estimatedTime / 60)
        });
    } catch (error) {
        console.error('Routine error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get MET value for a specific exercise
router.post('/met', async (req, res) => {
    try {
        const { exerciseName, category } = req.body;

        if (!exerciseName) {
            return res.status(400).json({ success: false, error: 'exerciseName required' });
        }

        // Find exercise in database
        let exercise = await Exercise.findByName(exerciseName);

        if (exercise) {
            res.json({
                success: true,
                exerciseName: exercise.name,
                category: exercise.category,
                met: exercise.met,
                found: true,
            });
        } else {
            // Return default MET based on category
            const defaultMET = Exercise.getDefaultMET(category);
            res.json({
                success: true,
                exerciseName: exerciseName.toLowerCase(),
                category: category || 'unknown',
                met: defaultMET,
                found: false,
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Calculate calories for an exercise (NO Gemini API needed!)
router.post('/calculate', async (req, res) => {
    try {
        const { exerciseName, category, weightKg, durationMinutes, reps, sets } = req.body;

        if (!exerciseName || !weightKg) {
            return res.status(400).json({
                success: false,
                error: 'exerciseName and weightKg required'
            });
        }

        // Find exercise in database
        let exercise = await Exercise.findByName(exerciseName);
        let met;
        let foundInDb = false;

        if (exercise) {
            met = exercise.met;
            foundInDb = true;
        } else {
            // Use default MET based on category
            met = Exercise.getDefaultMET(category);
        }

        // Calculate duration
        // If reps/sets provided, estimate duration (avg 30 seconds per set)
        let duration = durationMinutes;
        if (!duration && reps && sets) {
            duration = (sets * 0.5); // 30 seconds per set
        }
        if (!duration) {
            duration = 1; // Default 1 minute
        }

        // Calculate calories: (MET * weight * 3.5) / 200 * duration
        const calories = Exercise.calculateCalories(met, weightKg, duration);

        console.log(`🏋️ ${exerciseName}: MET=${met}, ${weightKg}kg, ${duration}min = ${calories} kcal`);

        res.json({
            success: true,
            exerciseName,
            category: exercise?.category || category || 'unknown',
            met,
            weightKg,
            durationMinutes: duration,
            calories,
            foundInDb,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Calculate calories for a complete workout
router.post('/workout', async (req, res) => {
    try {
        const { exercises, cardio, userWeight } = req.body;
        const weight = userWeight || 70;

        let totalCalories = 0;
        const breakdown = [];

        // Process each exercise
        for (const ex of exercises || []) {
            // Find in database
            let dbExercise = await Exercise.findByName(ex.name);
            let met = dbExercise?.met || Exercise.getDefaultMET(ex.category);

            // Calculate duration based on sets (30 sec per set)
            const totalSets = ex.sets?.length || 1;
            const duration = totalSets * 0.5; // minutes

            const calories = Exercise.calculateCalories(met, weight, duration);

            breakdown.push({
                name: ex.name,
                met,
                duration,
                calories,
            });
            totalCalories += calories;
        }

        // Process cardio
        if (cardio && cardio.type && cardio.duration) {
            const cardioExercise = await Exercise.findByName(cardio.type);
            const met = cardioExercise?.met || 7.0;
            const calories = Exercise.calculateCalories(met, weight, cardio.duration);

            breakdown.push({
                name: `Cardio: ${cardio.type}`,
                met,
                duration: cardio.duration,
                calories,
            });
            totalCalories += calories;
        }

        res.json({
            success: true,
            totalCalories: Math.round(totalCalories),
            breakdown,
            exerciseCount: exercises?.length || 0,
            cardioMinutes: cardio?.duration || 0,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add a new exercise (for custom exercises)
router.post('/add', async (req, res) => {
    try {
        const { name, category, type, met } = req.body;

        if (!name || !category || !met) {
            return res.status(400).json({
                success: false,
                error: 'name, category, and met required'
            });
        }

        const exercise = new Exercise({
            name: name.toLowerCase().trim(),
            category: category.toLowerCase(),
            type: type || 'compound',
            met,
        });

        await exercise.save();

        res.json({ success: true, exercise });
    } catch (error) {
        // Handle duplicate
        if (error.code === 11000) {
            res.status(400).json({ success: false, error: 'Exercise already exists' });
        } else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

module.exports = router;
