const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const Food = require('./models/Food');

async function listFoods() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const foods = await Food.find({}, 'name nameHindi caloriesPer100g proteinPer100g carbsPer100g fatsPer100g');
        console.log('\n--- FOOD LIST ---');
        foods.forEach((food, index) => {
            console.log(`${index + 1}. [${food._id}] ${food.name}${food.nameHindi ? ' (' + food.nameHindi + ')' : ''}`);
            console.log(`   Nutrition (per 100g): ${food.caloriesPer100g} kcal | P: ${food.proteinPer100g}g | C: ${food.carbsPer100g}g | F: ${food.fatsPer100g}g`);
        });
        console.log('------------------\n');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

listFoods();
