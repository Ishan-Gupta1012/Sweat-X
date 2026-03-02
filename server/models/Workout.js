const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    zones: [{
        type: String,
    }],
    split: {
        type: String,
    },
    duration: {
        type: Number, // in seconds
        required: true,
    },
    exercises: [{
        name: String,
        sets: [{
            weight: Number,
            reps: Number,
            intensity: String,
            time: Number,
            restTime: {
                type: Number, // in seconds
                default: 0
            },
            formRating: {
                type: Number, // 1-5 scale
                min: 0,
                max: 5
            }
        }],
    }],
    totalSets: {
        type: Number,
        default: 0,
    },
    caloriesBurned: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Workout', workoutSchema);
