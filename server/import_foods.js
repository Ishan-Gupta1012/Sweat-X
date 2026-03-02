const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const Food = require('./models/Food');
const newDb = require('./data/indian_food_db.json');

async function importData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Clearing existing food database for a fresh, high-accuracy sync...');
        await Food.deleteMany({});

        const mappedFoods = newDb.map(f => {
            // Convert per-gram to per-100g
            const n = f.nutrition_per_gram;
            let category = 'snack';
            if (f.category === 'Breakfast') category = 'breakfast';
            if (f.category === 'Lunch-Dinner') category = 'lunch';
            if (f.category === 'Occasional') category = 'snack'; // Enum doesn't have 'occasional'

            return {
                name: f.food_name,
                category: category,
                cuisine: 'indian',
                caloriesPer100g: Math.round(n.calories * 100),
                proteinPer100g: Math.round(n.protein * 100 * 10) / 10,
                carbsPer100g: Math.round(n.carbs * 100 * 10) / 10,
                fatsPer100g: Math.round(n.fat * 100 * 10) / 10,
                fiberPer100g: Math.round(n.fiber * 100 * 10) / 10,
                servingSizes: {
                    ...f.servings,
                    // Ensure defaults if missing
                    spoon: f.servings.spoon || 15,
                    bowl: f.servings.bowl || 250,
                    katori: f.servings.katori || 150,
                    plate: f.servings.plate || 300
                },
                defaultServing: Object.keys(f.servings)[0] || 'bowl',
                keywords: [f.food_name.toLowerCase()],
                isVegetarian: !f.food_name.toLowerCase().includes('chicken') && !f.food_name.toLowerCase().includes('mutton') && !f.food_name.toLowerCase().includes('egg') && !f.food_name.toLowerCase().includes('fish')
            };
        });

        await Food.insertMany(mappedFoods);
        console.log(`Success! ${mappedFoods.length} high-accuracy items are now live in your app.`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Import Error:', error);
    }
}

importData();
