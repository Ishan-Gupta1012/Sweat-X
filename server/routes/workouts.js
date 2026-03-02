const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');
const User = require('../models/User');

// Save a new workout
router.post('/', async (req, res) => {
    try {
        const { userId, title, zones, split, duration, exercises, totalSets, caloriesBurned: caloriesFromFrontend } = req.body;

        // Use frontend calories if provided, otherwise fallback to rough estimate
        const caloriesBurned = caloriesFromFrontend || Math.round((duration / 60) * 5);

        const workout = new Workout({
            userId,
            title,
            zones,
            split,
            duration,
            exercises,
            totalSets,
            caloriesBurned,
        });

        const savedWorkout = await workout.save();

        // Update user stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const user = await User.findOne({ deviceId: userId });
        if (user) {
            user.totalWorkouts += 1;

            // Check streak
            const lastWorkout = user.lastWorkoutDate ? new Date(user.lastWorkoutDate) : null;
            if (lastWorkout) {
                lastWorkout.setHours(0, 0, 0, 0);
                const diffDays = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    user.currentStreak += 1;
                } else if (diffDays > 1) {
                    user.currentStreak = 1;
                }
            } else {
                user.currentStreak = 1;
            }

            user.lastWorkoutDate = new Date();

            // Update daily stats
            user.caloriesBurned = (user.caloriesBurned || 0) + caloriesBurned;

            // Estimate minutes (cardio + strength)
            const strengthMinutes = Math.round(duration / 60) || 0;
            user.todayExerciseMinutes = (user.todayExerciseMinutes || 0) + strengthMinutes;

            await user.save();
        }

        res.status(201).json({
            success: true,
            workout: savedWorkout,
        });
    } catch (error) {
        console.log('🔴 [WORKOUT_SAVE_ERROR] Request Body:', JSON.stringify(req.body, null, 2));
        console.error('🔴 [WORKOUT_SAVE_ERROR] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.name === 'ValidationError' ? error.errors : undefined
        });
    }
});

// Get workouts for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, skip = 0 } = req.query;

        const workouts = await Workout.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Workout.countDocuments({ userId });

        res.json({
            success: true,
            workouts,
            total,
            hasMore: skip + workouts.length < total,
        });
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get workout stats for a user
router.get('/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;

        const totalWorkouts = await Workout.countDocuments({ userId });

        const stats = await Workout.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: '$duration' },
                    totalCalories: { $sum: '$caloriesBurned' },
                    totalSets: { $sum: '$totalSets' },
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                totalWorkouts,
                totalDuration: stats[0]?.totalDuration || 0,
                totalCalories: stats[0]?.totalCalories || 0,
                totalSets: stats[0]?.totalSets || 0,
            },
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
