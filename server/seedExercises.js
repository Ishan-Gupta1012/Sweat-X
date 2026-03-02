const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.error('❌ MongoDB error:', err);
        process.exit(1);
    });

const Exercise = require('./models/Exercise');

// Comprehensive exercise database with MET values
// MET values sourced from: Compendium of Physical Activities
const exercises = [
    // ==================== CHEST ====================
    { name: 'bench press', category: 'chest', type: 'compound', met: 5.0 },
    { name: 'incline bench press', category: 'chest', type: 'compound', met: 5.0 },
    { name: 'decline bench press', category: 'chest', type: 'compound', met: 5.0 },
    { name: 'dumbbell press', category: 'chest', type: 'compound', met: 5.0 },
    { name: 'dumbbell fly', category: 'chest', type: 'isolation', met: 4.0 },
    { name: 'incline dumbbell press', category: 'chest', type: 'compound', met: 5.0 },
    { name: 'incline dumbbell fly', category: 'chest', type: 'isolation', met: 4.0 },
    { name: 'cable crossover', category: 'chest', type: 'isolation', met: 4.0 },
    { name: 'cable fly', category: 'chest', type: 'isolation', met: 4.0 },
    { name: 'push up', category: 'chest', type: 'compound', met: 4.0 },
    { name: 'pushup', category: 'chest', type: 'compound', met: 4.0 },
    { name: 'wide push up', category: 'chest', type: 'compound', met: 4.0 },
    { name: 'diamond push up', category: 'chest', type: 'compound', met: 4.5 },
    { name: 'chest press machine', category: 'chest', type: 'compound', met: 4.5 },
    { name: 'pec deck', category: 'chest', type: 'isolation', met: 4.0 },
    { name: 'pec fly machine', category: 'chest', type: 'isolation', met: 4.0 },
    { name: 'dips', category: 'chest', type: 'compound', met: 5.5 },
    { name: 'chest dips', category: 'chest', type: 'compound', met: 5.5 },
    { name: 'landmine press', category: 'chest', type: 'compound', met: 4.5 },
    { name: 'smith machine bench press', category: 'chest', type: 'compound', met: 4.5 },

    // ==================== BACK ====================
    { name: 'deadlift', category: 'back', type: 'compound', met: 6.0 },
    { name: 'conventional deadlift', category: 'back', type: 'compound', met: 6.0 },
    { name: 'sumo deadlift', category: 'back', type: 'compound', met: 6.0 },
    { name: 'romanian deadlift', category: 'back', type: 'compound', met: 5.5 },
    { name: 'stiff leg deadlift', category: 'back', type: 'compound', met: 5.5 },
    { name: 'pull up', category: 'back', type: 'compound', met: 5.5 },
    { name: 'pullup', category: 'back', type: 'compound', met: 5.5 },
    { name: 'chin up', category: 'back', type: 'compound', met: 5.5 },
    { name: 'wide grip pull up', category: 'back', type: 'compound', met: 5.5 },
    { name: 'lat pulldown', category: 'back', type: 'compound', met: 5.0 },
    { name: 'wide grip lat pulldown', category: 'back', type: 'compound', met: 5.0 },
    { name: 'close grip lat pulldown', category: 'back', type: 'compound', met: 5.0 },
    { name: 'barbell row', category: 'back', type: 'compound', met: 5.0 },
    { name: 'bent over row', category: 'back', type: 'compound', met: 5.0 },
    { name: 'dumbbell row', category: 'back', type: 'compound', met: 5.0 },
    { name: 'one arm dumbbell row', category: 'back', type: 'compound', met: 5.0 },
    { name: 'cable row', category: 'back', type: 'compound', met: 4.5 },
    { name: 'seated cable row', category: 'back', type: 'compound', met: 4.5 },
    { name: 't bar row', category: 'back', type: 'compound', met: 5.0 },
    { name: 'machine row', category: 'back', type: 'compound', met: 4.5 },
    { name: 'face pull', category: 'back', type: 'isolation', met: 4.0 },
    { name: 'straight arm pulldown', category: 'back', type: 'isolation', met: 4.0 },
    { name: 'hyperextension', category: 'back', type: 'isolation', met: 4.0 },
    { name: 'back extension', category: 'back', type: 'isolation', met: 4.0 },
    { name: 'good morning', category: 'back', type: 'compound', met: 5.0 },
    { name: 'shrug', category: 'back', type: 'isolation', met: 4.0 },
    { name: 'barbell shrug', category: 'back', type: 'isolation', met: 4.0 },
    { name: 'dumbbell shrug', category: 'back', type: 'isolation', met: 4.0 },
    { name: 'rack pull', category: 'back', type: 'compound', met: 5.5 },

    // ==================== SHOULDERS ====================
    { name: 'overhead press', category: 'shoulders', type: 'compound', met: 5.0 },
    { name: 'military press', category: 'shoulders', type: 'compound', met: 5.0 },
    { name: 'shoulder press', category: 'shoulders', type: 'compound', met: 5.0 },
    { name: 'barbell shoulder press', category: 'shoulders', type: 'compound', met: 5.0 },
    { name: 'dumbbell shoulder press', category: 'shoulders', type: 'compound', met: 5.0 },
    { name: 'arnold press', category: 'shoulders', type: 'compound', met: 5.0 },
    { name: 'push press', category: 'shoulders', type: 'compound', met: 5.5 },
    { name: 'lateral raise', category: 'shoulders', type: 'isolation', met: 4.0 },
    { name: 'side lateral raise', category: 'shoulders', type: 'isolation', met: 4.0 },
    { name: 'dumbbell lateral raise', category: 'shoulders', type: 'isolation', met: 4.0 },
    { name: 'cable lateral raise', category: 'shoulders', type: 'isolation', met: 4.0 },
    { name: 'front raise', category: 'shoulders', type: 'isolation', met: 4.0 },
    { name: 'dumbbell front raise', category: 'shoulders', type: 'isolation', met: 4.0 },
    { name: 'plate front raise', category: 'shoulders', type: 'isolation', met: 4.0 },
    { name: 'rear delt fly', category: 'shoulders', type: 'isolation', met: 4.0 },
    { name: 'reverse fly', category: 'shoulders', type: 'isolation', met: 4.0 },
    { name: 'bent over lateral raise', category: 'shoulders', type: 'isolation', met: 4.0 },
    { name: 'upright row', category: 'shoulders', type: 'compound', met: 4.5 },
    { name: 'machine shoulder press', category: 'shoulders', type: 'compound', met: 4.5 },
    { name: 'smith machine shoulder press', category: 'shoulders', type: 'compound', met: 4.5 },
    { name: 'handstand push up', category: 'shoulders', type: 'compound', met: 6.0 },

    // ==================== LEGS ====================
    { name: 'squat', category: 'legs', type: 'compound', met: 6.0 },
    { name: 'back squat', category: 'legs', type: 'compound', met: 6.0 },
    { name: 'front squat', category: 'legs', type: 'compound', met: 6.0 },
    { name: 'goblet squat', category: 'legs', type: 'compound', met: 5.5 },
    { name: 'bodyweight squat', category: 'legs', type: 'compound', met: 5.0 },
    { name: 'leg press', category: 'legs', type: 'compound', met: 5.5 },
    { name: 'hack squat', category: 'legs', type: 'compound', met: 5.5 },
    { name: 'smith machine squat', category: 'legs', type: 'compound', met: 5.5 },
    { name: 'lunge', category: 'legs', type: 'compound', met: 5.0 },
    { name: 'walking lunge', category: 'legs', type: 'compound', met: 5.5 },
    { name: 'dumbbell lunge', category: 'legs', type: 'compound', met: 5.0 },
    { name: 'barbell lunge', category: 'legs', type: 'compound', met: 5.0 },
    { name: 'reverse lunge', category: 'legs', type: 'compound', met: 5.0 },
    { name: 'bulgarian split squat', category: 'legs', type: 'compound', met: 5.5 },
    { name: 'split squat', category: 'legs', type: 'compound', met: 5.0 },
    { name: 'step up', category: 'legs', type: 'compound', met: 5.0 },
    { name: 'leg extension', category: 'legs', type: 'isolation', met: 4.0 },
    { name: 'leg curl', category: 'legs', type: 'isolation', met: 4.0 },
    { name: 'seated leg curl', category: 'legs', type: 'isolation', met: 4.0 },
    { name: 'lying leg curl', category: 'legs', type: 'isolation', met: 4.0 },
    { name: 'calf raise', category: 'legs', type: 'isolation', met: 4.0 },
    { name: 'standing calf raise', category: 'legs', type: 'isolation', met: 4.0 },
    { name: 'seated calf raise', category: 'legs', type: 'isolation', met: 3.5 },
    { name: 'hip thrust', category: 'legs', type: 'compound', met: 5.0 },
    { name: 'barbell hip thrust', category: 'legs', type: 'compound', met: 5.0 },
    { name: 'glute bridge', category: 'legs', type: 'isolation', met: 4.0 },
    { name: 'hip abduction', category: 'legs', type: 'isolation', met: 3.5 },
    { name: 'hip adduction', category: 'legs', type: 'isolation', met: 3.5 },
    { name: 'sumo squat', category: 'legs', type: 'compound', met: 5.5 },
    { name: 'box squat', category: 'legs', type: 'compound', met: 5.5 },
    { name: 'sissy squat', category: 'legs', type: 'isolation', met: 4.5 },
    { name: 'pistol squat', category: 'legs', type: 'compound', met: 6.0 },

    // ==================== BICEPS ====================
    { name: 'bicep curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'barbell curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'dumbbell curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'dumbbell bicep curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'hammer curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'dumbbell hammer curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'concentration curl', category: 'biceps', type: 'isolation', met: 3.5 },
    { name: 'preacher curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'ez bar curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'cable curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'cable bicep curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'incline dumbbell curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'spider curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'reverse curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'zottman curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: 'drag curl', category: 'biceps', type: 'isolation', met: 4.0 },
    { name: '21s', category: 'biceps', type: 'isolation', met: 4.5 },
    { name: 'machine bicep curl', category: 'biceps', type: 'isolation', met: 3.5 },

    // ==================== TRICEPS ====================
    { name: 'tricep pushdown', category: 'triceps', type: 'isolation', met: 4.0 },
    { name: 'rope pushdown', category: 'triceps', type: 'isolation', met: 4.0 },
    { name: 'cable tricep pushdown', category: 'triceps', type: 'isolation', met: 4.0 },
    { name: 'tricep extension', category: 'triceps', type: 'isolation', met: 4.0 },
    { name: 'overhead tricep extension', category: 'triceps', type: 'isolation', met: 4.0 },
    { name: 'dumbbell tricep extension', category: 'triceps', type: 'isolation', met: 4.0 },
    { name: 'skull crusher', category: 'triceps', type: 'isolation', met: 4.0 },
    { name: 'lying tricep extension', category: 'triceps', type: 'isolation', met: 4.0 },
    { name: 'close grip bench press', category: 'triceps', type: 'compound', met: 5.0 },
    { name: 'tricep dip', category: 'triceps', type: 'compound', met: 5.0 },
    { name: 'bench dip', category: 'triceps', type: 'compound', met: 4.5 },
    { name: 'tricep kickback', category: 'triceps', type: 'isolation', met: 3.5 },
    { name: 'dumbbell kickback', category: 'triceps', type: 'isolation', met: 3.5 },
    { name: 'diamond push up', category: 'triceps', type: 'compound', met: 4.5 },
    { name: 'close grip push up', category: 'triceps', type: 'compound', met: 4.5 },
    { name: 'cable overhead extension', category: 'triceps', type: 'isolation', met: 4.0 },
    { name: 'single arm pushdown', category: 'triceps', type: 'isolation', met: 4.0 },
    { name: 'machine tricep dip', category: 'triceps', type: 'compound', met: 4.5 },

    // ==================== CORE ====================
    { name: 'crunch', category: 'core', type: 'isolation', met: 3.5 },
    { name: 'sit up', category: 'core', type: 'isolation', met: 4.0 },
    { name: 'situp', category: 'core', type: 'isolation', met: 4.0 },
    { name: 'plank', category: 'core', type: 'isolation', met: 4.0 },
    { name: 'side plank', category: 'core', type: 'isolation', met: 4.0 },
    { name: 'leg raise', category: 'core', type: 'isolation', met: 4.0 },
    { name: 'hanging leg raise', category: 'core', type: 'isolation', met: 4.5 },
    { name: 'russian twist', category: 'core', type: 'isolation', met: 4.0 },
    { name: 'mountain climber', category: 'core', type: 'cardio', met: 8.0 },
    { name: 'bicycle crunch', category: 'core', type: 'isolation', met: 4.0 },
    { name: 'ab wheel rollout', category: 'core', type: 'isolation', met: 5.0 },
    { name: 'cable crunch', category: 'core', type: 'isolation', met: 4.0 },
    { name: 'woodchop', category: 'core', type: 'compound', met: 4.5 },
    { name: 'dead bug', category: 'core', type: 'isolation', met: 3.5 },
    { name: 'bird dog', category: 'core', type: 'isolation', met: 3.5 },
    { name: 'toe touch', category: 'core', type: 'isolation', met: 3.5 },
    { name: 'v up', category: 'core', type: 'isolation', met: 4.5 },
    { name: 'flutter kick', category: 'core', type: 'isolation', met: 4.0 },

    // ==================== CARDIO ====================
    { name: 'running', category: 'cardio', type: 'cardio', met: 9.0 },
    { name: 'jogging', category: 'cardio', type: 'cardio', met: 7.0 },
    { name: 'walking', category: 'cardio', type: 'cardio', met: 3.5 },
    { name: 'brisk walking', category: 'cardio', type: 'cardio', met: 5.0 },
    { name: 'treadmill running', category: 'cardio', type: 'cardio', met: 9.0 },
    { name: 'treadmill walking', category: 'cardio', type: 'cardio', met: 4.0 },
    { name: 'cycling', category: 'cardio', type: 'cardio', met: 7.0 },
    { name: 'stationary bike', category: 'cardio', type: 'cardio', met: 7.0 },
    { name: 'spinning', category: 'cardio', type: 'cardio', met: 8.5 },
    { name: 'elliptical', category: 'cardio', type: 'cardio', met: 5.0 },
    { name: 'rowing', category: 'cardio', type: 'cardio', met: 7.0 },
    { name: 'rowing machine', category: 'cardio', type: 'cardio', met: 7.0 },
    { name: 'stair climber', category: 'cardio', type: 'cardio', met: 8.0 },
    { name: 'stair climbing', category: 'cardio', type: 'cardio', met: 8.0 },
    { name: 'jump rope', category: 'cardio', type: 'cardio', met: 11.0 },
    { name: 'skipping', category: 'cardio', type: 'cardio', met: 11.0 },
    { name: 'jumping jacks', category: 'cardio', type: 'cardio', met: 8.0 },
    { name: 'burpees', category: 'cardio', type: 'cardio', met: 10.0 },
    { name: 'burpee', category: 'cardio', type: 'cardio', met: 10.0 },
    { name: 'box jump', category: 'cardio', type: 'cardio', met: 8.0 },
    { name: 'high knees', category: 'cardio', type: 'cardio', met: 8.0 },
    { name: 'butt kicks', category: 'cardio', type: 'cardio', met: 7.0 },
    { name: 'swimming', category: 'cardio', type: 'cardio', met: 8.0 },
    { name: 'hiit', category: 'cardio', type: 'cardio', met: 10.0 },
    { name: 'sprinting', category: 'cardio', type: 'cardio', met: 12.0 },
    { name: 'sprint', category: 'cardio', type: 'cardio', met: 12.0 },
    { name: 'battle ropes', category: 'cardio', type: 'cardio', met: 9.0 },
    { name: 'kettlebell swing', category: 'cardio', type: 'cardio', met: 9.0 },
    { name: 'box step up', category: 'cardio', type: 'cardio', met: 6.0 },
    { name: 'bear crawl', category: 'cardio', type: 'cardio', met: 7.0 },
    { name: 'jumping lunge', category: 'cardio', type: 'cardio', met: 9.0 },
    { name: 'squat jump', category: 'cardio', type: 'cardio', met: 8.0 },
    { name: 'crosstrainer', category: 'cardio', type: 'cardio', met: 5.0 },
    { name: 'aerobics', category: 'cardio', type: 'cardio', met: 7.0 },
    { name: 'zumba', category: 'cardio', type: 'cardio', met: 7.5 },
    { name: 'dancing', category: 'cardio', type: 'cardio', met: 5.0 },

    // ==================== FULL BODY / COMPOUND ====================
    { name: 'clean', category: 'full_body', type: 'compound', met: 8.0 },
    { name: 'power clean', category: 'full_body', type: 'compound', met: 8.0 },
    { name: 'clean and jerk', category: 'full_body', type: 'compound', met: 9.0 },
    { name: 'snatch', category: 'full_body', type: 'compound', met: 8.5 },
    { name: 'thruster', category: 'full_body', type: 'compound', met: 8.0 },
    { name: 'man maker', category: 'full_body', type: 'compound', met: 9.0 },
    { name: 'farmers walk', category: 'full_body', type: 'compound', met: 6.0 },
    { name: 'turkish get up', category: 'full_body', type: 'compound', met: 6.0 },
    { name: 'wall ball', category: 'full_body', type: 'compound', met: 8.0 },
    { name: 'sled push', category: 'full_body', type: 'compound', met: 8.0 },
    { name: 'sled pull', category: 'full_body', type: 'compound', met: 7.0 },
    { name: 'rope climb', category: 'full_body', type: 'compound', met: 8.0 },
];

const seedDatabase = async () => {
    try {
        // Clear existing exercises
        await Exercise.deleteMany({});
        console.log('🗑️ Cleared existing exercises');

        // Insert all exercises
        await Exercise.insertMany(exercises);
        console.log(`✅ Inserted ${exercises.length} exercises`);

        // Show category counts
        const categories = await Exercise.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log('\n📊 Exercises by category:');
        categories.forEach(cat => {
            console.log(`   ${cat._id}: ${cat.count}`);
        });

        console.log('\n✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedDatabase();
