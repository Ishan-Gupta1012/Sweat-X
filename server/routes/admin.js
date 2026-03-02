const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Workout = require('../models/Workout');

/**
 * Get Platform Statistics for Admin Dashboard
 */
router.get('/stats', async (req, res) => {
    try {
        // 1. Total Users
        const totalUsers = await User.countDocuments();

        // 2. Active Today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const activeTodayCount = await User.countDocuments({
            lastActive: { $gte: startOfToday }
        });

        const activeUsers = await User.find({
            lastActive: { $gte: startOfToday }
        }).select('name email phoneNumber lastActive');

        // 3. Total Workouts Logged
        const totalWorkouts = await Workout.countDocuments();

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeToday: activeTodayCount,
                totalWorkouts,
                systemHealth: '100%' // Placeholder for now
            },
            activeUsers: activeUsers.map(u => ({
                name: u.name || 'Anonymous User',
                email: u.email || u.phoneNumber || 'No Contact',
                lastActive: u.lastActive
            }))
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch platform stats' });
    }
});

module.exports = router;
