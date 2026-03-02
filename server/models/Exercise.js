const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['chest', 'back', 'shoulders', 'legs', 'biceps', 'triceps', 'arms', 'cardio', 'core', 'full_body'],
        lowercase: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['strength', 'cardio', 'compound', 'isolation', 'flexibility'],
        lowercase: true,
    },
    met: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
    },
    description: {
        type: String,
        default: '',
    },
    videoUrl: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

// Index for fast lookups
exerciseSchema.index({ name: 1 });
exerciseSchema.index({ category: 1 });

// Static method to find exercise by name (partial match)
exerciseSchema.statics.findByName = async function (name) {
    const searchName = name.toLowerCase().trim();

    // Try exact match first
    let exercise = await this.findOne({ name: searchName });
    if (exercise) return exercise;

    // Try partial match
    exercise = await this.findOne({
        name: { $regex: searchName, $options: 'i' }
    });
    if (exercise) return exercise;

    // Try matching any word
    const words = searchName.split(' ');
    for (const word of words) {
        if (word.length > 3) {
            exercise = await this.findOne({
                name: { $regex: word, $options: 'i' }
            });
            if (exercise) return exercise;
        }
    }

    return null;
};

// Calculate calories burned
exerciseSchema.statics.calculateCalories = function (met, weightKg, durationMinutes) {
    // Formula: calories = (MET * weight * 3.5) / 200 * duration
    return Math.round((met * weightKg * 3.5) / 200 * durationMinutes);
};

// Get default MET based on category for unknown exercises
exerciseSchema.statics.getDefaultMET = function (category) {
    const defaults = {
        chest: 5.0,
        back: 5.0,
        shoulders: 4.5,
        legs: 6.0,
        biceps: 4.0,
        triceps: 4.0,
        arms: 4.0,
        cardio: 7.0,
        core: 4.0,
        full_body: 6.0,
    };
    return defaults[category?.toLowerCase()] || 5.0;
};

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;
