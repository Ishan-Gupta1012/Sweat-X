import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApi, workoutApi, getDeviceId, checkApiHealth, authApi } from '../services/api';

const UserContext = createContext();

const STORAGE_KEY = '@librefit_user_data';
const DEVICE_ID_KEY = '@librefit_device_id';

const defaultUserData = {
    // Profile
    email: '',
    name: '',
    age: '25',
    height: '170', // in cm
    gender: 'male',
    primaryGoal: 'muscle_gain',
    activityLevel: 'moderate', // sedentary, light, moderate, active

    // Weight
    weightGoal: 'lose',
    currentWeight: 75,
    targetWeight: 68,
    goalDuration: 12, // weeks to achieve goal
    trainingLevel: 'beginner', // beginner, intermediate, advanced
    trainingDaysPerWeek: 3,
    medicalConditions: '',
    weightHistory: [],

    // Onboarding
    onboardingComplete: false,

    // Daily Tracking
    dailyCalories: 0,
    calorieGoal: 2000, // Will be calculated
    caloriesBurned: 0, // Burned from workouts
    todayExerciseMinutes: 0, // Total exercise minutes today
    waterIntake: 0,
    waterGoal: 2000, // Default to 2000ml

    // Meal-type specific calories for colored display
    breakfastSnackCalories: 0, // Orange: breakfast + morning snack
    lunchSnackCalories: 0, // Green: lunch + evening snack
    dinnerCalories: 0, // Purple: dinner

    // Macros (will be calculated based on goal)
    proteinGoal: 120,
    carbsGoal: 250,
    fatsGoal: 65,
    fiberGoal: 25,

    // Macros Consumed
    proteinConsumed: 0,
    carbsConsumed: 0,
    fatsConsumed: 0,
    fiberConsumed: 0,

    // Calculated values for display
    bmr: 0,
    tdee: 0,
    dailyDeficit: 0,

    // Workout splits and plans
    customSplits: [],
    trainingPlan: null,

    // Meals
    meals: [],

    // Workouts
    workoutHistory: [],
    totalWorkouts: 0,
    currentStreak: 0,

    // Active workout session (persists across navigation)
    activeWorkoutSession: null, // { title, zones, exercises, timer, timestamp, split, exerciseLimit }

    // Nutrition Log (stores 30 days of data)
    // Format: { 'YYYY-MM-DD': { meals: [], totalCalories: 0, breakfastSnackCalories, lunchSnackCalories, dinnerCalories, caloriesBurned } }
    nutritionLog: {},
    lastResetDate: null, // Track when daily reset last occurred
};

// Calculate Water Goal (in ml)
const calculateWaterGoal = ({ currentWeight, activityLevel }) => {
    const weight = parseFloat(currentWeight) || 70;

    // Base: 33ml per kg
    let goal = weight * 33;

    // Activity Adjustment
    switch (activityLevel) {
        case 'sedentary': goal += 0; break;
        case 'light': goal += 350; break;
        case 'active': goal += 800; break;
        case 'moderate':
        default: goal += 500; break;
    }

    return Math.round(goal);
};

// Calculate BMR using Mifflin-St Jeor Equation
const calculateBMR = (weight, height, age, gender) => {
    const w = parseFloat(weight) || 70;
    const h = parseFloat(height) || 170;
    const a = parseFloat(age) || 25;

    if (gender === 'male') {
        // Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
        return Math.round(10 * w + 6.25 * h - 5 * a + 5);
    } else {
        // Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
        return Math.round(10 * w + 6.25 * h - 5 * a - 161);
    }
};

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,      // Desk job, little exercise
    light: 1.375,        // 1-3 workouts/week
    moderate: 1.55,      // 3-5 workouts/week
    active: 1.725,       // 6-7 workouts/week
};

// Calculate daily calorie goal based on user's complete profile
// Uses the scientific formula: BMR → TDEE → Deficit/Surplus based on timeline
const calculateCalorieGoal = (userData) => {
    const {
        currentWeight,
        targetWeight,
        height,
        age,
        gender,
        activityLevel = 'moderate',
        goalDuration = 12,
        primaryGoal,
    } = userData;

    // Step 1: Calculate BMR using Mifflin-St Jeor Equation
    const bmr = calculateBMR(currentWeight, height, age, gender);

    // Step 2: Calculate TDEE (Total Daily Energy Expenditure)
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
    const tdee = Math.round(bmr * multiplier);

    // Step 3: Calculate target calories based on goal
    let targetCalories = tdee;
    let dailyDeficit = 0;

    const weightDiff = parseFloat(currentWeight) - parseFloat(targetWeight);

    if (primaryGoal === 'fat_loss' || weightDiff > 0) {
        // FAT LOSS: Calculate based on weeks
        // 1 kg fat ≈ 7700 calories
        const totalCaloriesToLose = Math.abs(weightDiff) * 7700;
        const days = goalDuration * 7;

        // Calculate required daily deficit
        dailyDeficit = Math.round(totalCaloriesToLose / days);

        // SAFETY: Never allow daily deficit > 1000 kcal
        if (dailyDeficit > 1000) {
            console.log('⚠️ Deficit capped at 1000 kcal (was ' + dailyDeficit + ')');
            dailyDeficit = 1000;
        }

        targetCalories = tdee - dailyDeficit;

        // SAFETY: Never go below BMR
        if (targetCalories < bmr) {
            console.log('⚠️ Target raised to BMR (was ' + targetCalories + ')');
            targetCalories = bmr;
            dailyDeficit = tdee - bmr;
        }
    } else if (primaryGoal === 'muscle_gain' || weightDiff < 0) {
        // MUSCLE GAIN: TDEE + 250 to 500
        targetCalories = Math.round(tdee + 350); // Middle ground
        dailyDeficit = -350; // Negative = surplus
    } else {
        // STAY FIT / MAINTAIN: TDEE (maintenance)
        targetCalories = tdee;
        dailyDeficit = 0;
    }

    console.log('📊 Calorie Calculation:', {
        bmr,
        activityLevel,
        tdee,
        weightDiff: weightDiff.toFixed(1) + ' kg',
        goalDuration: goalDuration + ' weeks',
        dailyDeficit,
        targetCalories,
    });

    return {
        bmr,
        tdee,
        calorieGoal: Math.round(targetCalories),
        dailyDeficit,
        waterGoal: calculateWaterGoal(userData), // Added water goal calculation here too for consistency
    };
};

// Calculate macros based on calorie goal and primary goal
const calculateMacros = (calorieGoal, primaryGoal, weight) => {
    const w = parseFloat(weight) || 70;
    let proteinRatio, carbsRatio, fatsRatio;

    switch (primaryGoal) {
        case 'fat_loss':
            // High protein, moderate fat, lower carbs
            proteinRatio = 0.35; // 35% protein
            fatsRatio = 0.30;    // 30% fat
            carbsRatio = 0.35;   // 35% carbs
            break;
        case 'muscle_gain':
            // High protein, high carbs, moderate fat
            proteinRatio = 0.30; // 30% protein
            fatsRatio = 0.25;    // 25% fat
            carbsRatio = 0.45;   // 45% carbs
            break;
        case 'build_strength':
            // High protein, balanced
            proteinRatio = 0.30; // 30% protein
            fatsRatio = 0.30;    // 30% fat
            carbsRatio = 0.40;   // 40% carbs
            break;
        case 'general_fitness':
        default:
            // Balanced macros
            proteinRatio = 0.25; // 25% protein
            fatsRatio = 0.30;    // 30% fat
            carbsRatio = 0.45;   // 45% carbs
            break;
    }

    // Calculate grams (protein & carbs = 4 cal/g, fat = 9 cal/g)
    const proteinGoal = Math.round((calorieGoal * proteinRatio) / 4);
    const carbsGoal = Math.round((calorieGoal * carbsRatio) / 4);
    const fatsGoal = Math.round((calorieGoal * fatsRatio) / 9);

    return { proteinGoal, carbsGoal, fatsGoal };
};

export const UserProvider = ({ children }) => {
    const [userData, setUserData] = useState(defaultUserData);
    const [isLoading, setIsLoading] = useState(true);
    const [deviceId, setDeviceId] = useState(null);
    const [isApiAvailable, setIsApiAvailable] = useState(false);
    const skipServerSyncRef = React.useRef(false); // Flag to skip server sync during logout

    // Initialize device ID and load data
    useEffect(() => {
        initializeApp();
    }, []);

    const saveData = async (dataToSave) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    };

    // Save data to AsyncStorage whenever it changes
    useEffect(() => {
        if (!isLoading && deviceId && !skipServerSyncRef.current) {
            saveUserData();
        }
    }, [userData]);

    const initializeApp = async () => {
        try {
            console.log('>> initializeApp: started');
            // Get or create device ID
            let storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
            console.log('>> initializeApp: got device ID from async storage');
            if (!storedDeviceId) {
                storedDeviceId = getDeviceId();
                await AsyncStorage.setItem(DEVICE_ID_KEY, storedDeviceId);
            }
            setDeviceId(storedDeviceId);

            // Check API availability
            console.log('>> initializeApp: checking API health');
            const apiHealthy = await checkApiHealth();
            setIsApiAvailable(apiHealthy);
            console.log('>> initializeApp: API healthy =', apiHealthy);

            // Load local data first
            console.log('>> initializeApp: checking local async storage');
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            console.log('>> initializeApp: local data loaded');
            if (jsonValue !== null) {
                try {
                    const savedData = JSON.parse(jsonValue);

                    // Sanitize waterIntake (fix previous corruption)
                    if (typeof savedData.waterIntake !== 'number' || isNaN(savedData.waterIntake)) {
                        console.log('🧹 Sanitizing waterIntake state');
                        savedData.waterIntake = parseInt(savedData.waterIntake) || 0;
                    }

                    // Sanitize macros
                    if (typeof savedData.proteinConsumed !== 'number' || isNaN(savedData.proteinConsumed)) {
                        savedData.proteinConsumed = 0;
                    }
                    if (typeof savedData.carbsConsumed !== 'number' || isNaN(savedData.carbsConsumed)) {
                        savedData.carbsConsumed = 0;
                    }
                    if (typeof savedData.fatsConsumed !== 'number' || isNaN(savedData.fatsConsumed)) {
                        savedData.fatsConsumed = 0;
                    }

                    // Sanitize workout fields
                    if (!Array.isArray(savedData.workoutHistory)) {
                        savedData.workoutHistory = [];
                    }
                    if (typeof savedData.totalWorkouts !== 'number' || isNaN(savedData.totalWorkouts)) {
                        savedData.totalWorkouts = 0;
                    }
                    if (typeof savedData.currentStreak !== 'number' || isNaN(savedData.currentStreak)) {
                        savedData.currentStreak = 0;
                    }
                    if (typeof savedData.caloriesBurned !== 'number' || isNaN(savedData.caloriesBurned)) {
                        savedData.caloriesBurned = 0;
                    }
                    if (typeof savedData.dailyCalories !== 'number' || isNaN(savedData.dailyCalories)) {
                        savedData.dailyCalories = 0;
                    }

                    setUserData({ ...defaultUserData, ...savedData });

                    // Verify and fix waterGoal (migrate from glasses to ml if needed)
                    // If goal is < 500 (e.g. 8 glasses), it's likely old data. Recalculate.
                    const currentGoal = savedData.waterGoal || 0;
                    if (currentGoal < 500) {
                        console.log('💧 Migrating water goal from legacy value:', currentGoal);
                        const newGoal = calculateWaterGoal({ ...defaultUserData, ...savedData });
                        setUserData(prev => ({ ...prev, waterGoal: newGoal }));
                    }

                    // Ensure waterGoal is calculated if missing
                    if (!savedData.waterGoal) {
                        const waterGoal = calculateWaterGoal({ ...defaultUserData, ...savedData });
                        setUserData(prev => ({ ...prev, waterGoal }));
                    }
                } catch (e) {
                    console.error('❌ Error parsing saved data:', e);
                    setUserData(defaultUserData);
                }
            }

            // If API is available, sync with server
            if (apiHealthy) {
                const serverData = await userApi.getUser(storedDeviceId);
                if (serverData.success && serverData.user) {
                    // Merge server data with local
                    setUserData(prev => ({
                        ...prev,
                        totalWorkouts: serverData.user.totalWorkouts || prev.totalWorkouts,
                        currentStreak: serverData.user.currentStreak || prev.currentStreak,
                        caloriesBurned: serverData.user.caloriesBurned || prev.caloriesBurned,
                        todayExerciseMinutes: serverData.user.todayExerciseMinutes || prev.todayExerciseMinutes,
                        onboardingComplete: serverData.user.onboardingComplete !== undefined ? serverData.user.onboardingComplete : prev.onboardingComplete,
                    }));
                }
            }
            console.log('>> initializeApp: finished successfully');
        } catch (e) {
            console.error('Error initializing app:', e);
        } finally {
            console.log('>> initializeApp: setting isLoading = false');
            setIsLoading(false);
        }
    };

    const saveUserData = async () => {
        try {
            // Save locally
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

            // Sync to server if available - only sync server-compatible fields
            if (isApiAvailable && deviceId) {
                const serverSafeData = {
                    name: userData.name,
                    email: userData.email,
                    age: userData.age,
                    height: userData.height,
                    gender: userData.gender,
                    primaryGoal: userData.primaryGoal,
                    weightGoal: userData.weightGoal,
                    currentWeight: userData.currentWeight,
                    targetWeight: userData.targetWeight,
                    medicalConditions: userData.medicalConditions,
                    onboardingComplete: userData.onboardingComplete,
                    calorieGoal: userData.calorieGoal,
                    proteinGoal: userData.proteinGoal,
                    carbsGoal: userData.carbsGoal,
                    fatsGoal: userData.fatsGoal,
                    waterGoal: userData.waterGoal,
                    bmr: userData.bmr,
                    tdee: userData.tdee,
                    dailyDeficit: userData.dailyDeficit,
                    lastResetDate: userData.lastResetDate,
                    dailyCalories: userData.dailyCalories,
                    proteinConsumed: userData.proteinConsumed,
                    carbsConsumed: userData.carbsConsumed,
                    fatsConsumed: userData.fatsConsumed,
                    caloriesBurned: userData.caloriesBurned,
                    todayExerciseMinutes: userData.todayExerciseMinutes,
                };
                await userApi.saveUser(deviceId, serverSafeData);
            }
        } catch (e) {
            console.error('Error saving user data:', e);
        }
    };

    // Update user profile data
    const updateProfile = async (data) => {
        // Check if we need to recalculate goals
        const shouldRecalculate =
            data.currentWeight !== undefined ||
            data.targetWeight !== undefined ||
            data.height !== undefined ||
            data.age !== undefined ||
            data.gender !== undefined ||
            data.primaryGoal !== undefined ||
            data.goalDuration !== undefined ||
            data.activityLevel !== undefined;

        if (shouldRecalculate) {
            const newData = { ...userData, ...data };
            const { bmr, tdee, calorieGoal, dailyDeficit } = calculateCalorieGoal(newData);
            const macros = calculateMacros(calorieGoal, newData.primaryGoal, newData.currentWeight);

            console.log('📊 Recalculated nutrition goals:', { bmr, tdee, calorieGoal, dailyDeficit, ...macros });

            setUserData(prev => ({
                ...prev,
                ...data,
                bmr,
                tdee,
                calorieGoal,
                dailyDeficit,
                waterGoal: calculateWaterGoal(newData), // Recalculate water goal
                ...macros,
            }));
        } else {
            setUserData(prev => ({ ...prev, ...data }));
        }

        // Sync to server if available
        if (isApiAvailable && deviceId) {
            await userApi.saveUser(deviceId, data);
        }
    };

    // Auth functions
    const register = async (data) => {
        if (!isApiAvailable) return { success: false, error: 'Backend Not Available' };

        const result = await authApi.register({ ...data, deviceId }); // Send current deviceId to link
        if (result.success) {
            setUserData(prev => ({ ...prev, ...result.user }));
            saveData({ ...userData, ...result.user });
            return { success: true };
        }
        return result;
    };

    const login = async (credentials) => {
        if (!isApiAvailable) return { success: false, error: 'Backend Not Available' };

        const result = await authApi.login(credentials);
        if (result.success) {
            const serverUser = result.user;

            // Update deviceId if it came from the server (e.g. logging in on a new device)
            if (serverUser.deviceId && serverUser.deviceId !== deviceId) {
                setDeviceId(serverUser.deviceId);
                await AsyncStorage.setItem(DEVICE_ID_KEY, serverUser.deviceId);
            }

            // Server data takes priority - user is returning, use their stored data
            // Only use defaults for fields NOT present in server response
            const mergedData = { ...defaultUserData, ...serverUser };

            setUserData(mergedData);
            await saveData(mergedData);

            return { success: true, user: serverUser };
        }
        return result;
    };

    const googleLogin = async (data) => {
        if (!isApiAvailable) return { success: false, error: 'Backend Not Available' };

        const result = await authApi.googleLogin({ ...data, deviceId });
        if (result.success) {
            setUserData(prev => ({ ...prev, ...result.user }));
            saveData({ ...userData, ...result.user });
            return { success: true };
        }
        return result;
    };

    // Update daily calories
    const addCalories = (amount) => {
        setUserData(prev => ({
            ...prev,
            dailyCalories: prev.dailyCalories + amount,
        }));
    };

    // Update water intake
    const addWater = (glasses = 1) => {
        // Safety: handle cases where glasses might be an event object or non-number
        const amount = typeof glasses === 'number' && !isNaN(glasses) ? glasses : 1;
        setUserData(prev => {
            const current = typeof prev.waterIntake === 'number' ? prev.waterIntake : (parseInt(prev.waterIntake) || 0);
            return {
                ...prev,
                waterIntake: current + amount,
            };
        });
    };

    // Remove water intake
    const removeWater = (glasses = 1) => {
        // Safety: handle cases where glasses might be an event object or non-number
        const amount = typeof glasses === 'number' && !isNaN(glasses) ? glasses : 1;
        setUserData(prev => {
            const current = typeof prev.waterIntake === 'number' ? prev.waterIntake : (parseInt(prev.waterIntake) || 0);
            return {
                ...prev,
                waterIntake: Math.max(0, current - amount),
            };
        });
    };

    // Add a meal - tracks calories by meal type
    const addMeal = (meal) => {
        const mealType = meal.type || 'other';
        const calories = meal.calories || 0;

        setUserData(prev => {
            // Group meal types for colored display
            // Orange: breakfast + morningSnack
            // Green: lunch + eveningSnack
            // Purple: dinner
            let breakfastSnackCalories = prev.breakfastSnackCalories || 0;
            let lunchSnackCalories = prev.lunchSnackCalories || 0;
            let dinnerCalories = prev.dinnerCalories || 0;

            if (mealType === 'breakfast' || mealType === 'morningSnack') {
                breakfastSnackCalories += calories;
            } else if (mealType === 'lunch' || mealType === 'eveningSnack') {
                lunchSnackCalories += calories;
            } else if (mealType === 'dinner') {
                dinnerCalories += calories;
            }

            // Sum macros from foods if not explicitly provided at the meal level
            const mealProtein = meal.protein || (meal.foods || []).reduce((sum, f) => sum + (f.protein || 0), 0);
            const mealCarbs = meal.carbs || (meal.foods || []).reduce((sum, f) => sum + (f.carbs || 0), 0);
            const mealFats = meal.fats || (meal.foods || []).reduce((sum, f) => sum + (f.fats || 0), 0);
            const mealFiber = meal.fiber || (meal.foods || []).reduce((sum, f) => sum + (f.fiber || 0), 0);

            return {
                ...prev,
                meals: [...prev.meals, { ...meal, id: Date.now(), timestamp: new Date().toISOString() }],
                dailyCalories: prev.dailyCalories + calories,
                proteinConsumed: (prev.proteinConsumed || 0) + mealProtein,
                carbsConsumed: (prev.carbsConsumed || 0) + mealCarbs,
                fatsConsumed: (prev.fatsConsumed || 0) + mealFats,
                fiberConsumed: (prev.fiberConsumed || 0) + mealFiber,
                breakfastSnackCalories,
                lunchSnackCalories,
                dinnerCalories,
            };
        });
    };

    // Save completed workout - NOW SYNCS TO MONGODB!
    const saveWorkout = async (workout) => {
        const newWorkout = {
            ...workout,
            id: Date.now(),
            date: new Date().toISOString(),
        };

        // Calculate exercise minutes from cardio + strength training
        let exerciseListCardioMins = 0;
        (workout.exercises || []).forEach(ex => {
            ex.sets?.forEach(s => {
                exerciseListCardioMins += (parseInt(s.time) || 0);
            });
        });

        const cardioMinutes = (workout.cardio?.duration || 0) + exerciseListCardioMins;
        const strengthMinutes = Math.round(workout.duration / 60) || 0;
        const totalExerciseMinutes = cardioMinutes + (cardioMinutes > 0 ? 0 : strengthMinutes); // Don't double count if timer was running

        // Update local state immediately with calories burned
        setUserData(prev => {
            const today = new Date().toISOString().split('T')[0];
            const lastWorkoutDate = prev.lastWorkoutDate || null;

            // Calculate streak
            let newStreak = prev.currentStreak || 0;

            if (lastWorkoutDate !== today) {
                // This is the first workout of the day
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastWorkoutDate === yesterdayStr) {
                    // Worked out yesterday, continue streak
                    newStreak = newStreak + 1;
                } else if (lastWorkoutDate === null || lastWorkoutDate !== today) {
                    // Missed a day or first workout ever, reset to 1
                    newStreak = 1;
                }
            }
            // If already worked out today, don't change streak

            console.log('📊 Updating caloriesBurned. Prev:', prev.caloriesBurned, 'Adding:', workout.caloriesBurned);
            return {
                ...prev,
                workoutHistory: [newWorkout, ...(prev.workoutHistory || [])],
                totalWorkouts: (prev.totalWorkouts || 0) + 1,
                currentStreak: newStreak,
                lastWorkoutDate: today,
                caloriesBurned: (parseFloat(prev.caloriesBurned) || 0) + (parseFloat(workout.caloriesBurned) || 0),
                todayExerciseMinutes: (prev.todayExerciseMinutes || 0) + totalExerciseMinutes,
            };
        });

        // Sync to MongoDB if available
        if (isApiAvailable && deviceId) {
            try {
                const result = await workoutApi.saveWorkout(deviceId, workout);
                if (result.success) {
                    console.log('✅ Workout saved to MongoDB:', result.workout._id);
                } else {
                    console.error('❌ Server failed to save workout:', result.error);
                    if (result.details) {
                        console.error('📋 Error details:', JSON.stringify(result.details, null, 2));
                    }
                }
            } catch (error) {
                console.error('Error syncing workout to MongoDB:', error);
            }
        }
    };

    // Fetch workouts from MongoDB
    const fetchWorkouts = async (limit = 20) => {
        if (!isApiAvailable || !deviceId) {
            return userData.workoutHistory;
        }

        try {
            const result = await workoutApi.getWorkouts(deviceId, limit);
            if (result.success) {
                return result.workouts;
            }
        } catch (error) {
            console.error('Error fetching workouts:', error);
        }

        return userData.workoutHistory;
    };

    // Save active workout session (persists even when user navigates away)
    const saveActiveWorkout = (session) => {
        setUserData(prev => ({
            ...prev,
            activeWorkoutSession: {
                ...session,
                lastUpdated: new Date().toISOString(),
            },
        }));
    };

    // Clear active workout session (called when workout is finished)
    const clearActiveWorkout = () => {
        setUserData(prev => ({
            ...prev,
            activeWorkoutSession: null,
        }));
    };

    // Delete active workout (abandon without saving)
    const deleteActiveWorkout = () => {
        setUserData(prev => ({
            ...prev,
            activeWorkoutSession: null,
        }));
    };

    // Reset daily tracking
    const resetDaily = () => {
        setUserData(prev => ({
            ...prev,
            dailyCalories: 0,
            proteinConsumed: 0,
            carbsConsumed: 0,
            fatsConsumed: 0,
            fiberConsumed: 0,
            waterIntake: 0,
            meals: [],
        }));
    };

    // Complete onboarding - Calculate calorie goals based on user data
    const completeOnboarding = async () => {
        // Calculate BMR, TDEE, and calorie goals using the comprehensive formula
        const { bmr, tdee, calorieGoal, dailyDeficit } = calculateCalorieGoal(userData);
        const macros = calculateMacros(calorieGoal, userData.primaryGoal, userData.currentWeight);

        console.log('📊 Calculated nutrition goals:', {
            bmr,
            tdee,
            calorieGoal,
            dailyDeficit,
            ...macros,
            goal: userData.primaryGoal,
            activityLevel: userData.activityLevel,
            goalDuration: userData.goalDuration + ' weeks',
        });

        const updatedUserData = {
            ...userData,
            onboardingComplete: true,
            bmr,
            tdee,
            calorieGoal,
            dailyDeficit,
            waterGoal: calculateWaterGoal(userData),
            ...macros,
        };

        setUserData(prev => ({
            ...prev,
            onboardingComplete: true,
            bmr,
            tdee,
            calorieGoal,
            dailyDeficit,
            waterGoal: calculateWaterGoal(userData),
            ...macros,
        }));

        // Create user in MongoDB
        if (isApiAvailable && deviceId) {
            console.log('🔄 Saving to MongoDB with deviceId:', deviceId);
            console.log('🔄 onboardingComplete being saved:', true);
            const result = await userApi.saveUser(deviceId, updatedUserData);
            console.log('✅ MongoDB save result:', result);
        } else {
            console.log('⚠️ API not available or no deviceId, skipping server sync');
        }
    };

    // Recalculate goals when user data changes
    const recalculateGoals = (overrideData) => {
        const dataToUse = overrideData || userData;
        const { bmr, tdee, calorieGoal, dailyDeficit } = calculateCalorieGoal(dataToUse);
        const macros = calculateMacros(calorieGoal, dataToUse.primaryGoal, dataToUse.currentWeight);

        setUserData(prev => ({
            ...prev,
            bmr,
            tdee,
            calorieGoal,
            dailyDeficit,
            waterGoal: calculateWaterGoal(dataToUse),
            ...macros,
        }));
    };

    // Clear all data (local only - don't sync to server)
    const clearAllData = async () => {
        try {
            // Prevent syncing cleared data to server
            skipServerSyncRef.current = true;
            await AsyncStorage.removeItem(STORAGE_KEY);
            setUserData(defaultUserData);
            // Reset flag after a short delay to allow state update
            setTimeout(() => { skipServerSyncRef.current = false; }, 100);
        } catch (e) {
            console.error('Error clearing data:', e);
            skipServerSyncRef.current = false;
        }
    };

    // ============ CUSTOM SPLITS & TRAINING PLANS ============

    const addCustomSplit = async (name, zones) => {
        const newSplit = {
            id: Date.now().toString(),
            name,
            zones,
            createdAt: new Date().toISOString()
        };

        setUserData(prev => ({
            ...prev,
            customSplits: [...(prev.customSplits || []), newSplit]
        }));
    };

    const deleteCustomSplit = (id) => {
        setUserData(prev => ({
            ...prev,
            customSplits: prev.customSplits.filter(s => s.id !== id)
        }));
    };

    const generateTrainingPlan = async (prefs) => {
        const { daysPerWeek, duration, equipment, trainingLevel, preset } = prefs || {};

        const plan = {
            id: Date.now().toString(),
            trainingLevel: trainingLevel || 'beginner',
            daysPerWeek: parseInt(daysPerWeek) || 3,
            splitType: '',
            muscleFrequency: '',
            schedule: [],
            generatedAt: new Date().toISOString()
        };

        let splitType = '';
        let muscleFrequency = '';

        // Generate splits based on days per week - realistic for Indian gym scenario
        // Machines may not always be free, so focus on practical muscle pairings

        // Set dynamic exercise limit based on level
        const getLimit = (level) => {
            if (level === 'advanced') return 8;
            if (level === 'intermediate') return 6;
            return 5; // beginner
        };
        const exerciseLimit = getLimit(plan.trainingLevel);

        if (plan.daysPerWeek >= 6) {
            // 6 days: Push/Pull/Legs x2 (most effective for high frequency)
            splitType = 'Push, Pull, Legs (2x)';
            muscleFrequency = '2x/week per muscle';
            plan.schedule = [
                { day: 1, title: 'Push Day A', zones: ['chest', 'shoulders', 'triceps'], exerciseLimit, exercises: [] },
                { day: 2, title: 'Pull Day A', zones: ['back', 'biceps'], exerciseLimit, exercises: [] },
                { day: 3, title: 'Leg Day A', zones: ['legs'], exerciseLimit, exercises: [] },
                { day: 4, title: 'Push Day B', zones: ['chest', 'shoulders', 'triceps'], exerciseLimit, exercises: [] },
                { day: 5, title: 'Pull Day B', zones: ['back', 'biceps'], exerciseLimit, exercises: [] },
                { day: 6, title: 'Leg Day B + Core', zones: ['legs', 'abs'], exerciseLimit, exercises: [] },
            ];
        } else if (plan.daysPerWeek === 5) {
            // 5 days: Upper/Lower/Push/Pull/Legs hybrid
            splitType = 'Hypertrophy Pro';
            muscleFrequency = '1.5-2x/week per muscle';
            plan.schedule = [
                { day: 1, title: 'Push (Chest Focus)', zones: ['chest', 'triceps'], exerciseLimit, exercises: [] },
                { day: 2, title: 'Pull (Back Focus)', zones: ['back', 'biceps'], exerciseLimit, exercises: [] },
                { day: 3, title: 'Legs + Core', zones: ['legs', 'abs'], exerciseLimit, exercises: [] },
                { day: 4, title: 'Shoulders + Arms', zones: ['shoulders', 'biceps', 'triceps'], exerciseLimit, exercises: [] },
                { day: 5, title: 'Full Lower Body', zones: ['legs'], exerciseLimit, exercises: [] },
            ];
        } else if (plan.daysPerWeek === 4) {
            // 4 days: Upper/Lower split done twice
            splitType = 'Upper / Lower (2x)';
            muscleFrequency = '2x/week per muscle';
            plan.schedule = [
                { day: 1, title: 'Upper Body A (Push Focus)', zones: ['chest', 'shoulders', 'triceps'], exerciseLimit, exercises: [] },
                { day: 2, title: 'Lower Body A', zones: ['legs', 'abs'], exerciseLimit, exercises: [] },
                { day: 3, title: 'Upper Body B (Pull Focus)', zones: ['back', 'biceps'], exerciseLimit, exercises: [] },
                { day: 4, title: 'Lower Body B + Core', zones: ['legs', 'abs'], exerciseLimit, exercises: [] },
            ];
        } else if (plan.daysPerWeek === 3) {
            // 3 days: Full body or PPL
            if (plan.trainingLevel === 'beginner') {
                splitType = 'Full Body Fundamentals';
                muscleFrequency = '3x/week per muscle';
                plan.schedule = [
                    { day: 1, title: 'Full Body A', zones: ['chest', 'back', 'legs'], exerciseLimit: 5, exercises: [] },
                    { day: 2, title: 'Full Body B', zones: ['shoulders', 'legs', 'arms'], exerciseLimit: 5, exercises: [] },
                    { day: 3, title: 'Full Body C', zones: ['chest', 'back', 'abs'], exerciseLimit: 5, exercises: [] },
                ];
            } else {
                splitType = 'Push, Pull, Legs';
                muscleFrequency = '1x/week per muscle';
                plan.schedule = [
                    { day: 1, title: 'Push Day', zones: ['chest', 'shoulders', 'triceps'], exerciseLimit, exercises: [] },
                    { day: 2, title: 'Pull Day', zones: ['back', 'biceps'], exerciseLimit, exercises: [] },
                    { day: 3, title: 'Leg Day + Core', zones: ['legs', 'abs'], exerciseLimit, exercises: [] },
                ];
            }
        } else {
            // 2 days: Full body
            splitType = 'Full Body (2x)';
            muscleFrequency = '2x/week per muscle';
            plan.schedule = [
                { day: 1, title: 'Full Body A (Upper Focus)', zones: ['chest', 'back', 'shoulders'], exerciseLimit: 5, exercises: [] },
                { day: 2, title: 'Full Body B (Lower Focus)', zones: ['legs', 'arms', 'abs'], exerciseLimit: 5, exercises: [] },
            ];
        }

        plan.splitType = splitType;
        plan.muscleFrequency = muscleFrequency;

        // Fetch recommended exercises for each day from the backend
        try {
            const { exerciseApi } = require('../services/api');
            for (let i = 0; i < plan.schedule.length; i++) {
                const session = plan.schedule[i];
                const result = await exerciseApi.recommendExercises(
                    session.zones,
                    plan.trainingLevel,
                    session.exerciseLimit
                );
                if (result.success && result.exercises) {
                    plan.schedule[i].exercises = result.exercises;
                }
            }
        } catch (error) {
            console.error('Failed to fetch exercise recommendations:', error);
            // Continue with empty exercises - user can add manually
        }

        setUserData(prev => ({
            ...prev,
            trainingLevel: plan.trainingLevel,
            trainingDaysPerWeek: plan.daysPerWeek,
            trainingPlan: plan,
            onboardingComplete: true
        }));

        return plan;
    };

    // Update exercises for a specific day in the training plan
    const updateDayExercises = (dayIndex, exercises) => {
        setUserData(prev => {
            if (!prev.trainingPlan) return prev;
            const newSchedule = [...prev.trainingPlan.schedule];
            if (newSchedule[dayIndex]) {
                newSchedule[dayIndex] = { ...newSchedule[dayIndex], exercises };
            }
            return {
                ...prev,
                trainingPlan: { ...prev.trainingPlan, schedule: newSchedule }
            };
        });
    };

    // Add a single exercise to a specific day
    const addExerciseToDay = (dayIndex, exercise) => {
        setUserData(prev => {
            if (!prev.trainingPlan) return prev;
            const newSchedule = [...prev.trainingPlan.schedule];
            if (newSchedule[dayIndex]) {
                const currentExercises = newSchedule[dayIndex].exercises || [];
                newSchedule[dayIndex] = {
                    ...newSchedule[dayIndex],
                    exercises: [...currentExercises, exercise]
                };
            }
            return {
                ...prev,
                trainingPlan: { ...prev.trainingPlan, schedule: newSchedule }
            };
        });
    };

    // Remove an exercise from a specific day
    const removeExerciseFromDay = (dayIndex, exerciseIndex) => {
        setUserData(prev => {
            if (!prev.trainingPlan) return prev;
            const newSchedule = [...prev.trainingPlan.schedule];
            if (newSchedule[dayIndex]) {
                const currentExercises = [...(newSchedule[dayIndex].exercises || [])];
                currentExercises.splice(exerciseIndex, 1);
                newSchedule[dayIndex] = {
                    ...newSchedule[dayIndex],
                    exercises: currentExercises
                };
            }
            return {
                ...prev,
                trainingPlan: { ...prev.trainingPlan, schedule: newSchedule }
            };
        });
    };

    // ============ NUTRITION LOG FUNCTIONS ============

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Check and reset daily values at midnight
    // This should be called on app open and periodically
    const checkAndResetDaily = () => {
        const today = getTodayDate();
        const lastReset = userData.lastResetDate;

        // If already reset today, do nothing
        if (lastReset === today) {
            return false;
        }

        console.log('🌅 Daily reset triggered. Last reset:', lastReset, 'Today:', today);

        // Archive yesterday's data to nutritionLog if there was any data
        if (lastReset && (userData.dailyCalories > 0 || userData.meals.length > 0 || userData.caloriesBurned > 0)) {
            const newLog = { ...userData.nutritionLog };

            // Save yesterday's data
            newLog[lastReset] = {
                meals: [...userData.meals],
                totalCalories: userData.dailyCalories,
                breakfastSnackCalories: userData.breakfastSnackCalories,
                lunchSnackCalories: userData.lunchSnackCalories,
                dinnerCalories: userData.dinnerCalories,
                caloriesBurned: userData.caloriesBurned,
                waterIntake: userData.waterIntake,
                todayExerciseMinutes: userData.todayExerciseMinutes,
            };

            // Cleanup data older than 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            Object.keys(newLog).forEach(date => {
                if (new Date(date) < thirtyDaysAgo) {
                    console.log('🗑️ Removing old nutrition data for:', date);
                    delete newLog[date];
                }
            });

            setUserData(prev => ({
                ...prev,
                nutritionLog: newLog,
                lastResetDate: today,
                // Reset daily values
                dailyCalories: 0,
                proteinConsumed: 0,
                carbsConsumed: 0,
                fatsConsumed: 0,
                fiberConsumed: 0,
                meals: [],
                breakfastSnackCalories: 0,
                lunchSnackCalories: 0,
                dinnerCalories: 0,
                caloriesBurned: 0,
                waterIntake: 0,
                todayExerciseMinutes: 0,
            }));

            console.log('✅ Archived data for', lastReset, 'and reset daily values');
            return true;
        } else {
            // Update lastResetDate but DON'T reset daily values if server already has today's data
            // This preserves data restored from server after login
            const hasExistingData = userData.dailyCalories > 0 || userData.meals.length > 0 || userData.caloriesBurned > 0;

            if (hasExistingData) {
                // Just update the date marker, preserve the existing data
                setUserData(prev => ({
                    ...prev,
                    lastResetDate: today,
                }));
            } else {
                // No existing data, safe to reset
                setUserData(prev => ({
                    ...prev,
                    lastResetDate: today,
                    dailyCalories: 0,
                    meals: [],
                    breakfastSnackCalories: 0,
                    lunchSnackCalories: 0,
                    dinnerCalories: 0,
                    caloriesBurned: 0,
                    waterIntake: 0,
                    todayExerciseMinutes: 0,
                }));
            }
            return false;
        }
    };

    // Get nutrition data for a specific date
    const getNutritionForDate = (dateString) => {
        // If it's today, return current daily data
        if (dateString === getTodayDate()) {
            return {
                meals: userData.meals,
                totalCalories: userData.dailyCalories,
                breakfastSnackCalories: userData.breakfastSnackCalories,
                lunchSnackCalories: userData.lunchSnackCalories,
                dinnerCalories: userData.dinnerCalories,
                caloriesBurned: userData.caloriesBurned,
                waterIntake: userData.waterIntake,
                isToday: true,
            };
        }

        // Return from nutrition log
        const dayData = userData.nutritionLog[dateString];
        if (dayData) {
            return { ...dayData, isToday: false };
        }

        // No data for this date
        return {
            meals: [],
            totalCalories: 0,
            breakfastSnackCalories: 0,
            lunchSnackCalories: 0,
            dinnerCalories: 0,
            caloriesBurned: 0,
            waterIntake: 0,
            isToday: false,
        };
    };

    // Get all dates that have nutrition data (for calendar)
    const getDatesWithNutritionData = () => {
        const dates = Object.keys(userData.nutritionLog);
        // Add today if there's data
        if (userData.dailyCalories > 0 || userData.meals.length > 0) {
            dates.push(getTodayDate());
        }
        return dates;
    };

    // Update a meal for a specific date
    const updateMealForDate = (dateString, mealId, updatedMeal) => {
        if (dateString === getTodayDate()) {
            // Update today's meal
            setUserData(prev => {
                const oldMeal = prev.meals.find(m => m.id === mealId);
                const calorieDiff = updatedMeal.calories - (oldMeal?.calories || 0);

                return {
                    ...prev,
                    meals: prev.meals.map(m => m.id === mealId ? { ...m, ...updatedMeal } : m),
                    dailyCalories: prev.dailyCalories + calorieDiff,
                };
            });
        } else {
            // Update historical meal
            setUserData(prev => {
                const dayData = prev.nutritionLog[dateString];
                if (!dayData) return prev;

                const oldMeal = dayData.meals.find(m => m.id === mealId);
                const calorieDiff = updatedMeal.calories - (oldMeal?.calories || 0);

                return {
                    ...prev,
                    nutritionLog: {
                        ...prev.nutritionLog,
                        [dateString]: {
                            ...dayData,
                            meals: dayData.meals.map(m => m.id === mealId ? { ...m, ...updatedMeal } : m),
                            totalCalories: dayData.totalCalories + calorieDiff,
                        },
                    },
                };
            });
        }
    };

    // Delete a meal for a specific date
    const deleteMealForDate = (dateString, mealId) => {
        if (dateString === getTodayDate()) {
            // Delete today's meal
            setUserData(prev => {
                const meal = prev.meals.find(m => m.id === mealId);
                const calories = meal?.calories || 0;
                const mealType = meal?.type || 'other';

                // Calculate macros from the meal being deleted
                const mealProtein = meal?.protein || (meal?.foods || []).reduce((sum, f) => sum + (f.protein || 0), 0);
                const mealCarbs = meal?.carbs || (meal?.foods || []).reduce((sum, f) => sum + (f.carbs || 0), 0);
                const mealFats = meal?.fats || (meal?.foods || []).reduce((sum, f) => sum + (f.fats || 0), 0);
                const mealFiber = meal?.fiber || (meal?.foods || []).reduce((sum, f) => sum + (f.fiber || 0), 0);

                let breakfastSnackCalories = prev.breakfastSnackCalories;
                let lunchSnackCalories = prev.lunchSnackCalories;
                let dinnerCalories = prev.dinnerCalories;

                // Subtract from appropriate category
                if (mealType === 'breakfast' || mealType === 'morningSnack') {
                    breakfastSnackCalories -= calories;
                } else if (mealType === 'lunch' || mealType === 'eveningSnack') {
                    lunchSnackCalories -= calories;
                } else if (mealType === 'dinner') {
                    dinnerCalories -= calories;
                }

                return {
                    ...prev,
                    meals: prev.meals.filter(m => m.id !== mealId),
                    dailyCalories: Math.max(0, prev.dailyCalories - calories),
                    proteinConsumed: Math.max(0, (prev.proteinConsumed || 0) - mealProtein),
                    carbsConsumed: Math.max(0, (prev.carbsConsumed || 0) - mealCarbs),
                    fatsConsumed: Math.max(0, (prev.fatsConsumed || 0) - mealFats),
                    fiberConsumed: Math.max(0, (prev.fiberConsumed || 0) - mealFiber),
                    breakfastSnackCalories: Math.max(0, breakfastSnackCalories),
                    lunchSnackCalories: Math.max(0, lunchSnackCalories),
                    dinnerCalories: Math.max(0, dinnerCalories),
                };
            });
        } else {
            // Delete historical meal
            setUserData(prev => {
                const dayData = prev.nutritionLog[dateString];
                if (!dayData) return prev;

                const meal = dayData.meals.find(m => m.id === mealId);
                const calories = meal?.calories || 0;

                return {
                    ...prev,
                    nutritionLog: {
                        ...prev.nutritionLog,
                        [dateString]: {
                            ...dayData,
                            meals: dayData.meals.filter(m => m.id !== mealId),
                            totalCalories: Math.max(0, dayData.totalCalories - calories),
                        },
                    },
                };
            });
        }
    };

    return (
        <UserContext.Provider
            value={{
                userData,
                isLoading,
                deviceId,
                isApiAvailable,
                updateProfile,
                addCalories,
                addWater,
                removeWater,
                addMeal,
                saveWorkout,
                fetchWorkouts,
                saveActiveWorkout,
                clearActiveWorkout,
                deleteActiveWorkout,
                resetDaily,
                completeOnboarding,
                clearAllData,
                // Nutrition Log functions
                checkAndResetDaily,
                getNutritionForDate,
                getDatesWithNutritionData,
                updateMealForDate,
                deleteMealForDate,
                getTodayDate,
                register,
                login,
                googleLogin,
                recalculateGoals,
                addCustomSplit,
                deleteCustomSplit,
                generateTrainingPlan,
                updateDayExercises,
                addExerciseToDay,
                removeExerciseFromDay,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export default UserContext;
