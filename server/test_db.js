const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connection successful');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });
