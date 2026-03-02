const mongoose = require('mongoose');

// Schema to cache exercise calorie data to reduce API calls
// Stores calories per rep for each exercise at a specific weight
const exerciseCalorieSchema = new mongoose.Schema({
    // Normalized exercise name (lowercase, trimmed)
    exerciseName: {
        type: String,
        required: true,
        index: true,
    },
    // Weight in kg
    weight: {
        type: Number,
        required: true,
        index: true,
    },
    // Calories burned per rep at this weight
    caloriesPerRep: {
        type: Number,
        required: true,
    },
    // Source of the data
    source: {
        type: String,
        default: 'gemini',
        enum: ['gemini', 'manual', 'estimate'],
    },
    // Times this cache entry was used
    usageCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Compound index for efficient lookups
exerciseCalorieSchema.index({ exerciseName: 1, weight: 1 }, { unique: true });

// Static method to get calories or return null if not cached
exerciseCalorieSchema.statics.getCachedCalories = async function (exerciseName, weight) {
    const normalized = exerciseName.toLowerCase().trim();
    const entry = await this.findOne({ exerciseName: normalized, weight });

    if (entry) {
        // Increment usage count
        entry.usageCount += 1;
        await entry.save();
        return entry.caloriesPerRep;
    }

    return null;
};

// Static method to cache new calorie data
exerciseCalorieSchema.statics.cacheCalories = async function (exerciseName, weight, caloriesPerRep, source = 'gemini') {
    const normalized = exerciseName.toLowerCase().trim();

    try {
        await this.findOneAndUpdate(
            { exerciseName: normalized, weight },
            {
                exerciseName: normalized,
                weight,
                caloriesPerRep,
                source,
                $inc: { usageCount: 1 }
            },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        console.error('Error caching exercise calories:', error);
        return false;
    }
};

module.exports = mongoose.model('ExerciseCalorie', exerciseCalorieSchema);
