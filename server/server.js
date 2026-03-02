const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Request logger
app.use((req, res, next) => {
    const size = req.headers['content-length'] ? (parseInt(req.headers['content-length']) / 1024 / 1024).toFixed(2) + 'MB' : 'unknown';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Size: ${size}`);
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const workoutRoutes = require('./routes/workouts');
const userRoutes = require('./routes/users');
const calorieRoutes = require('./routes/calories');
const exerciseRoutes = require('./routes/exercises');
const foodRoutes = require('./routes/foods');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

app.use('/api/workouts', workoutRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calories', calorieRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Sweat-X API is running' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Error handling for unexpected failures
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

