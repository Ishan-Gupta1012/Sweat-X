import { Platform } from 'react-native';
// API URL - Switch between local and production
// For local development on mobile, use your computer's IP address
// For production APK, use the deployed URL on Render.com
// export const API_URL = 'http://192.168.1.15:3001/api';
export const API_URL = 'https://true-fit-server-ten.vercel.app/api';

// Generate a unique device ID for this installation
const getDeviceId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 24; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Auth API
export const authApi = {
    async register(userData) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    },

    async login(credentials) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },

    async googleLogin(data) {
        try {
            const response = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return await response.json();
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, error: error.message };
        }
    }
};

// User API
export const userApi = {
    // Create or update user
    async saveUser(deviceId, userData) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, ...userData }),
                signal: controller.signal
            });
            clearTimeout(id);
            return await response.json();
        } catch (error) {
            console.error('Error saving user:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user data
    async getUser(deviceId) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(`${API_URL}/users/${deviceId}`, { signal: controller.signal });
            clearTimeout(id);
            return await response.json();
        } catch (error) {
            console.error('Error fetching user:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user
    async updateUser(deviceId, updates) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(`${API_URL}/users/${deviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
                signal: controller.signal
            });
            clearTimeout(id);
            return await response.json();
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    },
};

// Workout API
export const workoutApi = {
    // Save a workout
    async saveWorkout(userId, workoutData) {
        try {
            const response = await fetch(`${API_URL}/workouts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...workoutData }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error saving workout:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user's workouts
    async getWorkouts(userId, limit = 20, skip = 0) {
        try {
            const response = await fetch(
                `${API_URL}/workouts/${userId}?limit=${limit}&skip=${skip}`
            );
            return await response.json();
        } catch (error) {
            console.error('Error fetching workouts:', error);
            return { success: false, error: error.message };
        }
    },

    // Get workout stats
    async getStats(userId) {
        try {
            const response = await fetch(`${API_URL}/workouts/${userId}/stats`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { success: false, error: error.message };
        }
    },
};

// Exercise API - MET-based calorie calculation (NO Gemini API needed!)
export const exerciseApi = {
    // Get all exercises or by category
    async getExercises(category = null) {
        try {
            const url = category
                ? `${API_URL}/exercises/category/${category}`
                : `${API_URL}/exercises`;
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Error fetching exercises:', error);
            return { success: false, exercises: [] };
        }
    },

    // Search exercises by name
    async searchExercises(name) {
        try {
            const response = await fetch(`${API_URL}/exercises/search/${encodeURIComponent(name)}`);
            return await response.json();
        } catch (error) {
            console.error('Error searching exercises:', error);
            return { success: false, exercises: [] };
        }
    },

    // Get MET value for an exercise
    async getMET(exerciseName, category = null) {
        try {
            const response = await fetch(`${API_URL}/exercises/met`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exerciseName, category }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting MET:', error);
            return { success: false, met: 5.0 }; // Default MET
        }
    },

    // Calculate calories for an exercise (uses database, not Gemini!)
    async calculateCalories(exerciseName, weightKg, durationMinutes, category = null) {
        try {
            const response = await fetch(`${API_URL}/exercises/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exerciseName, weightKg, durationMinutes, category }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error calculating calories:', error);
            // Fallback calculation locally
            const defaultMET = 5.0;
            const calories = Math.round((defaultMET * weightKg * 3.5) / 200 * durationMinutes);
            return { success: false, calories };
        }
    },

    // Calculate calories for complete workout
    async calculateWorkoutCalories(exercises, cardio, userWeight) {
        try {
            const response = await fetch(`${API_URL}/exercises/workout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exercises, cardio, userWeight }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error calculating workout calories:', error);
            return { success: false, totalCalories: 0 };
        }
    },

    // Get all categories
    async getCategories() {
        try {
            const response = await fetch(`${API_URL}/exercises/categories`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching categories:', error);
            return { success: false, categories: [] };
        }
    },

    // Get recommended exercises for a workout day
    async recommendExercises(zones, level = 'beginner', limit = 6) {
        try {
            const response = await fetch(`${API_URL}/exercises/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zones, level, limit }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting exercise recommendations:', error);
            return { success: false, exercises: [] };
        }
    },

    // Get a complete workout routine based on available time
    async getRoutine(zones, time = 60, level = 'beginner') {
        try {
            const response = await fetch(`${API_URL}/exercises/routine`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zones, time, level }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting workout routine:', error);
            return { success: false, routine: [] };
        }
    }
};

// AI API
export const aiApi = {
    async chat(prompt, temperature = 0.7, maxTokens = 400) {
        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, temperature, maxTokens }),
            });
            return await response.json();
        } catch (error) {
            console.error('AI Chat API error:', error);
            return { success: false, error: error.message };
        }
    },

    async calculate(prompt) {
        try {
            const response = await fetch(`${API_URL}/ai/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            return await response.json();
        } catch (error) {
            console.error('AI Calculate API error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Admin API
export const adminApi = {
    async getStats() {
        try {
            const response = await fetch(`${API_URL}/admin/stats`);
            return await response.json();
        } catch (error) {
            console.error('Admin Stats API error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Health check
export const checkApiHealth = async () => {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        return data.status === 'ok';
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
};

export { getDeviceId };

