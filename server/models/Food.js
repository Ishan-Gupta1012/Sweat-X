const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true,
    },
    nameHindi: {
        type: String,
        index: true,
    },
    category: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'dessert', 'staple'],
        default: 'lunch',
    },
    cuisine: {
        type: String,
        enum: ['indian', 'chinese', 'italian', 'american', 'mexican', 'japanese', 'thai', 'mediterranean', 'other'],
        default: 'indian',
    },
    isVegetarian: {
        type: Boolean,
        default: true,
    },

    // Nutrition per 100g
    caloriesPer100g: {
        type: Number,
        required: true,
    },
    proteinPer100g: {
        type: Number,
        default: 0,
    },
    carbsPer100g: {
        type: Number,
        default: 0,
    },
    fatsPer100g: {
        type: Number,
        default: 0,
    },
    fiberPer100g: {
        type: Number,
        default: 0,
    },

    // Common serving sizes in grams
    servingSizes: {
        spoon: { type: Number, default: 15 },      // 1 tablespoon
        bowl: { type: Number, default: 250 },      // 1 medium bowl
        katori: { type: Number, default: 150 },    // 1 katori
        plate: { type: Number, default: 300 },     // 1 plate serving
        cup: { type: Number, default: 200 },       // 1 cup
        piece: { type: Number, default: 50 },      // 1 piece (average)
        glass: { type: Number, default: 250 },     // 1 glass
        roti: { type: Number, default: 40 },       // 1 roti/chapati
        paratha: { type: Number, default: 80 },    // 1 paratha
        slice: { type: Number, default: 30 },      // 1 slice
    },

    defaultServing: {
        type: String,
        default: 'bowl',
    },
    servingDescription: {
        type: String,
        default: '1 serving',
    },

    // Search optimization
    keywords: [{
        type: String,
        index: true,
    }],

    popularity: {
        type: Number,
        default: 0,
    },

    imageUrl: String,
}, {
    timestamps: true,
});

// Create text index for search
foodSchema.index({ name: 'text', nameHindi: 'text', keywords: 'text' });

// Static method to search foods
foodSchema.statics.searchFoods = async function (query, limit = 20) {
    const regex = new RegExp(query, 'i');
    return this.find({
        $or: [
            { name: regex },
            { nameHindi: regex },
            { keywords: regex },
        ]
    })
        .sort({ popularity: -1 })
        .limit(limit);
};

// Method to calculate nutrition for a serving
foodSchema.methods.calculateNutrition = function (servingType, quantity = 1) {
    const servingGrams = this.servingSizes[servingType] || 100;
    const totalGrams = servingGrams * quantity;
    const multiplier = totalGrams / 100;

    return {
        grams: totalGrams,
        calories: Math.round(this.caloriesPer100g * multiplier),
        protein: Math.round(this.proteinPer100g * multiplier * 10) / 10,
        carbs: Math.round(this.carbsPer100g * multiplier * 10) / 10,
        fats: Math.round(this.fatsPer100g * multiplier * 10) / 10,
        fiber: Math.round(this.fiberPer100g * multiplier * 10) / 10,
    };
};

module.exports = mongoose.model('Food', foodSchema);
