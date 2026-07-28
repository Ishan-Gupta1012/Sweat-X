import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@truefit_theme';

// Dark Theme (OLED Black + Neon Cyan)
export const darkTheme = {
    isDark: true,
    background: '#000000',
    secondaryBackground: '#0A0F0C',
    cardBackground: 'rgba(255, 255, 255, 0.05)',
    cardBackgroundLight: 'rgba(255, 255, 255, 0.1)',
    surfaceSelected: 'rgba(82, 183, 136, 0.15)',
    primary: '#2D6A4F',
    primaryDark: '#1B4332',
    primaryLight: '#40916C',
    primaryLighter: '#52B788',

    // Screen-Specific Brand Colors
    brandWorkout: '#52B788',
    brandNutrition: '#40916C',
    brandProfile: '#95D5B2',
    brandDashboard: '#2D6A4F',
    brandAI: '#40916C',

    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    textDisabled: '#52525B',
    border: 'rgba(255, 255, 255, 0.1)',
    divider: 'rgba(255, 255, 255, 0.05)',
    success: '#52B788',
    warning: '#F4A261',
    error: '#EF4444',
    info: '#2D6A4F',
    protein: '#52B788',
    carbs: '#40916C',
    fats: '#95D5B2',
    fiber: '#F4A261',
    water: '#3B82F6',
    gradientPrimary: ['#0A0F0C', '#000000'],
    gradientDark: ['#1B4332', '#081C15'],
    gradientAccent: ['#52B788', '#95D5B2'],
};

// Light Theme (Black + Orange - kept for compatibility but not used)
export const lightTheme = {
    isDark: false,
    background: '#F3F4F6',
    cardBackground: '#FFFFFF',
    cardBackgroundLight: '#E5E7EB',
    primary: '#F97316',
    primaryDark: '#EA580C',
    primaryLight: '#FB923C',
    textPrimary: '#000000',
    textSecondary: '#374151',
    textMuted: '#6B7280',
    border: '#D1D5DB',
    divider: '#E5E7EB',
    success: '#F97316',              // Orange (NO GREEN)
    warning: '#FB923C',
    error: '#EF4444',
    info: '#F97316',
    protein: '#3B82F6',              // Bold Blue
    carbs: '#10B981',                // Vibrant Green
    fats: '#8B5CF6',                 // Purple/Violet
    fiber: '#F59E0B',                // Gold/Amber
    water: '#60A5FA',
    gradientPrimary: ['#F97316', '#EA580C'],
    gradientDark: ['#FFFFFF', '#F3F4F6'],
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // App is locked to Dark Mode for consistent Black + Orange experience
    const isDarkMode = true;
    const theme = darkTheme;
    const isLoading = false;

    const toggleTheme = () => {
        // Theme switching is disabled
        console.log('Theme toggle disabled - locked to Black + Orange');
    };

    const setDarkMode = () => {
        // Theme switching is disabled
    };

    return (
        <ThemeContext.Provider value={{
            isDarkMode,
            theme,
            toggleTheme,
            setDarkMode,
            isLoading,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
