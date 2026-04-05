const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await User.countDocuments();
        const users = await User.find().select('name email phoneNumber lastActive').limit(20);
        console.log('Total Users:', count);
        console.log('Users Data:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
