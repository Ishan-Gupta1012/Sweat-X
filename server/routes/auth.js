const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Register new user (Email/Password)
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, deviceId } = req.body;
        console.log(`[AUTH] Register attempt: ${email} / ${phone}`);

        // Validation: Required fields
        if (!email && !phone) {
            console.log('[AUTH] Register failed: Missing email and phone');
            return res.status(400).json({ success: false, error: 'Email or phone number is required' });
        }
        if (!password || password.length < 6) {
            console.log('[AUTH] Register failed: Weak password');
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }

        // Check for existing user - ONLY check non-empty fields
        const query = [];
        if (email && email.trim() !== '') query.push({ email: email.trim() });
        if (phone && phone.trim() !== '') query.push({ phoneNumber: phone.trim() });

        if (query.length > 0) {
            const existingUser = await User.findOne({ $or: query });
            if (existingUser) {
                const conflict = existingUser.email === email ? 'Email' : 'Phone number';
                console.log(`[AUTH] Register failed: ${conflict} already exists`);
                return res.status(400).json({
                    success: false,
                    error: `${conflict} already registered`
                });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check for hardcoded Superadmin
        const isSuperAdmin = (email && email.toLowerCase() === 'ishangupta1012@gmail.com') || (phone === '9711668300');

        // Create user
        const user = new User({
            name: name || 'User',
            email: email ? email.toLowerCase().trim() : '',
            phoneNumber: phone ? phone.trim() : '',
            password: hashedPassword,
            deviceId: deviceId || `user_${Date.now()}`,
            authProvider: 'local',
            isAdmin: isSuperAdmin,
        });

        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ success: true, user: userResponse });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
    }
});

// Login (Email or Phone + Password)
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ success: false, error: 'Missing identifier or password' });
        }

        const cleanIdentifier = identifier.trim().toLowerCase();

        // Find user
        const user = await User.findOne({
            $or: [
                { email: cleanIdentifier },
                { phoneNumber: cleanIdentifier }
            ]
        }).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'Account not found. Please register first.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid security key' });
        }

        // Check if user is Superadmin dynamically (in case of legacy account without flag)
        const isSuperAdmin = (user.email === 'ishangupta1012@gmail.com') || (user.phoneNumber === '9711668300');

        const userResponse = user.toObject();

        if (isSuperAdmin && !user.isAdmin) {
            user.isAdmin = true;
            await user.save();
            userResponse.isAdmin = true;
        }

        // Return user without password
        delete userResponse.password;

        // Ensure onboardingComplete is always present (even if not in DB)
        if (userResponse.onboardingComplete === undefined || userResponse.onboardingComplete === false) {
            // Retroactively detect if onboarding is complete based on presence of key profile data
            const hasProfileData =
                (user.primaryGoal && user.primaryGoal !== '') ||
                (user.currentWeight && user.currentWeight > 0) ||
                (user.age && user.age !== '');

            if (hasProfileData) {
                console.log('[AUTH] Retroactively marking onboardingComplete = true for:', cleanIdentifier);
                userResponse.onboardingComplete = true;
                // Also update the database if it was false
                if (user.onboardingComplete === false) {
                    user.onboardingComplete = true;
                    await user.save();
                }
            } else {
                userResponse.onboardingComplete = false;
            }
        }

        // DEBUG: Log what we're returning
        console.log('[AUTH] Login successful for:', cleanIdentifier);
        console.log('[AUTH] onboardingComplete:', userResponse.onboardingComplete);
        console.log('[AUTH] isAdmin:', userResponse.isAdmin);
        console.log('[AUTH] User data keys:', Object.keys(userResponse));

        res.json({ success: true, user: userResponse });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Google Login Sync
router.post('/google', async (req, res) => {
    try {
        const { email, name, photo, deviceId } = req.body;

        const isSuperAdmin = email && email.toLowerCase() === 'ishangupta1012@gmail.com';

        let user = await User.findOne({ email });

        if (user) {
            // Update existing user with Google info if missing
            user.authProvider = 'google';
            if (!user.profileImage) user.profileImage = photo;

            // Retroactively grant admin if they match
            if (isSuperAdmin && !user.isAdmin) user.isAdmin = true;

            await user.save();
        } else {
            // Create new Google user
            user = new User({
                email,
                name,
                profileImage: photo,
                authProvider: 'google',
                deviceId: deviceId || `google_${Date.now()}`,
                isAdmin: isSuperAdmin,
                // Password left empty for Google users
            });
            await user.save();
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
