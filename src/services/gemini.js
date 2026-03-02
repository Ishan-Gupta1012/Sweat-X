import { aiApi } from './api';

/**
 * Calculate calories burned for a single exercise per rep at given weight
 * This is stored in MongoDB for future lookups
 */
export const calculateExerciseCaloriesPerRep = async (exerciseName, weightKg) => {
    const prompt = `You are a fitness expert. Calculate the calories burned for 1 rep of "${exerciseName}" with ${weightKg}kg weight.

Consider:
- The muscle groups worked
- Average time per rep (2-3 seconds)
- Energy expenditure based on weight lifted

Respond with ONLY a number (calories per rep, can be decimal like 0.5). No explanation.`;

    const result = await aiApi.calculate(prompt);
    return result.success ? result.number : null;
};

/**
 * Calculate calories burned for cardio activity
 */
export const calculateCardioCalories = async (cardioType, durationMinutes, userWeightKg, intensity = 'moderate') => {
    const prompt = `Calculate calories burned for ${durationMinutes} minutes of ${intensity} intensity ${cardioType} by a person weighing ${userWeightKg}kg.

Use standard MET values:
- Walking: 3.5 MET
- Running: 8-12 MET based on intensity
- Cycling: 6-10 MET
- Swimming: 6-10 MET
- Jump rope: 10-12 MET
- HIIT: 8-12 MET

Formula: Calories = MET × weight(kg) × duration(hours)

Respond with ONLY a number (integer calories). No explanation.`;

    const result = await aiApi.calculate(prompt);
    return result.success ? result.number : null;
};

/**
 * Calculate total workout calories including all exercises and cardio
 */
export const calculateWorkoutCalories = async (exercises, cardio, userWeightKg) => {
    const exerciseList = exercises.map(ex =>
        `${ex.name}: ${ex.sets.map(s => `${s.reps} reps @ ${s.weight}kg`).join(', ')}`
    ).join('\n');

    const cardioList = cardio ?
        `Cardio: ${cardio.type} for ${cardio.duration} minutes at ${cardio.intensity || 'moderate'} intensity` :
        'No cardio';

    const prompt = `Calculate total calories burned for this workout by a ${userWeightKg}kg person:

STRENGTH EXERCISES:
${exerciseList || 'None'}

CARDIO:
${cardioList}

Consider:
1. Each strength exercise rep burns 0.1-1.5 calories depending on weight and muscle groups
2. Compound exercises burn more than isolation
3. Rest periods don't count
4. Cardio uses MET values

Respond with ONLY a number (integer total calories burned). No explanation.`;

    const result = await aiApi.calculate(prompt);
    return result.success ? result.number : null;
};

/**
 * Chat with the AI Coach
 */
export const chatWithCoach = async (userMessage, userProfile = {}) => {
    // Format user profile for context
    const profileContext = userProfile ? `
    User Context:
    - Name: ${userProfile.name || 'User'}
    - Age: ${userProfile.age || 'N/A'}
    - Gender: ${userProfile.gender || 'N/A'}
    - Height: ${userProfile.height}cm
    - Weight: ${userProfile.currentWeight}kg (Goal: ${userProfile.targetWeight}kg)
    - Primary Goal: ${userProfile.primaryGoal?.replace('_', ' ') || 'General Fitness'}
    - Activity Level: ${userProfile.activityLevel || 'N/A'}
    - Calorie Goal: ${userProfile.calorieGoal || 'N/A'} kcal/day
    ` : '';

    const systemPrompt = `You are a Master Gym Trainer and World Class Fitness Coach. You serve users of the 'Sweat-X' app. 
    
    Your Role:
    - Answer fitness, nutrition, and workout questions with expertise.
    - CRITICAL: Be EXTREMELY CONCISE (max 2-3 sentences) by default. Users are training and have no time to read.
    - Use bullet points if listing items.
    - ONLY provide detailed explanations if explicitly asked (e.g., "explain why").
    - If asked about medical issues, advise consulting a doctor.
    - Use emojis occasionally to keep the tone friendly.

    ${profileContext}
    
    User Query: ${userMessage}`;

    const result = await aiApi.chat(systemPrompt);
    return result.success ? result.text : "I'm having trouble connecting to HQ. Please try again later.";
};

export default {
    calculateExerciseCaloriesPerRep,
    calculateCardioCalories,
    calculateWorkoutCalories,
    chatWithCoach,
};
