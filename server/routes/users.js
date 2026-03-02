const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create or update user
router.post('/', async (req, res) => {
    try {
        const { deviceId, ...userData } = req.body;

        console.log('[USERS] Save request received:');
        console.log('[USERS] deviceId:', deviceId);
        console.log('[USERS] onboardingComplete:', userData.onboardingComplete);

        if (!deviceId) {
            return res.status(400).json({ success: false, error: 'deviceId is required' });
        }

        const user = await User.findOneAndUpdate(
            { deviceId },
            {
                $set: userData,
                $currentDate: { lastActive: true }
            },
            { upsert: true, new: true }
        );

        console.log('[USERS] Saved user _id:', user._id);
        console.log('[USERS] User email after save:', user.email);
        console.log('[USERS] User onboardingComplete after save:', user.onboardingComplete);

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user by deviceId
router.get('/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;

        const user = await User.findOneAndUpdate(
            { deviceId },
            { $currentDate: { lastActive: true } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update user profile
router.put('/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const updates = req.body;

        const user = await User.findOneAndUpdate(
            { deviceId },
            {
                $set: updates,
                $currentDate: { lastActive: true }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
