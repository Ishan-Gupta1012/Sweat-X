const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const identifier = 'test@example.com'; // Change to an actual user if known
        const password = 'password123';

        console.log(`Checking user: ${identifier}`);
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { phoneNumber: identifier }
            ]
        }).select('+password');

        if (!user) {
            console.log('User not found (this is a 404, not a 500)');
            return;
        }

        console.log('User found, comparing password...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Is match:', isMatch);

    } catch (error) {
        console.error('ERROR DETECTED:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testLogin();
