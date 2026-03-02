const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        index: true,
    },
    email: {
        type: String,
        default: '',
        index: true,
    },
    phoneNumber: {
        type: String,
        default: '',
        index: true,
    },
    password: {
        type: String,
        select: false, // Do not return password by default
    },
    authProvider: {
        type: String,
        enum: ['guest', 'google', 'local'],
        default: 'guest',
    },
    profileImage: {
        type: String,
        default: '',
    },
    name: {
        type: String,
        default: '',
    },
    age: {
        type: String,
        default: '',
    },
    height: {
        type: String,
        default: '170',
    },
    gender: {
        type: String,
        default: '',
    },
    primaryGoal: {
        type: String,
        default: '',
    },
    weightGoal: {
        type: String,
        default: 'maintain',
    },
    currentWeight: {
        type: Number,
        default: 70,
    },
    targetWeight: {
        type: Number,
        default: 70,
    },
    medicalConditions: {
        type: String,
        default: '',
    },
    totalWorkouts: {
        type: Number,
        default: 0,
    },
    currentStreak: {
        type: Number,
        default: 0,
    },
    lastWorkoutDate: {
        type: Date,
    },
    onboardingComplete: {
        type: Boolean,
        default: false,
    },
    // Nutrition \u0026 Progress
    nutritionLog: {
        type: Object, // Stores YYYY-MM-DD keys
        default: {},
    },
    meals: {
        type: Array,
        default: [],
    },
    weightHistory: {
        type: Array,
        default: [],
    },
    // Goals \u0026 Macros
    calorieGoal: Number,
    proteinGoal: Number,
    carbsGoal: Number,
    fatsGoal: Number,
    waterGoal: Number,
    bmr: Number,
    tdee: Number,
    dailyDeficit: Number,
    // Daily Tracking
    lastResetDate: String,
    dailyCalories: {
        type: Number,
        default: 0,
    },
    proteinConsumed: {
        type: Number,
        default: 0,
    },
    carbsConsumed: {
        type: Number,
        default: 0,
    },
    fatsConsumed: {
        type: Number,
        default: 0,
    },
    fiberGoal: Number,
    fiberConsumed: {
        type: Number,
        default: 0,
    },
    caloriesBurned: {
        type: Number,
        default: 0,
    },
    todayExerciseMinutes: {
        type: Number,
        default: 0,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
