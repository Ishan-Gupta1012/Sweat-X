import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@truefit_theme';

// Dark Theme (OLED Black + Neon Cyan)
export const darkTheme = {
    isDark: true,
    background: '#000000',           // Absolute Black
    secondaryBackground: '#09090B',  // Elevated Black
    cardBackground: '#121212',       // Card Background
    cardBackgroundLight: '#18181b',  // Modals
    surfaceSelected: '#27272a',      // Focus/Selected
    primary: '#06B6D4',              // Electric Cyan
    primaryDark: '#0891B2',          // Hover Cyan
    primaryLight: '#22D3EE',         // Light Cyan
    primaryLighter: '#67E8F9',       // Lighter Cyan

    // Screen-Specific Brand Colors (Multi-color Premium UI)
    brandWorkout: '#8B5CF6',         // Vibrant Violet
    brandNutrition: '#10B981',       // Emerald Green
    brandProfile: '#F43F5E',         // Rose Red
    brandDashboard: '#06B6D4',       // Electric Cyan
    brandAI: '#6366F1',              // Indigo

    textPrimary: '#FAFAFA',          // Bright White
    textSecondary: '#E4E4E7',        // Soft White
    textMuted: '#A1A1AA',            // Muted Grey
    textDisabled: '#71717A',         // Disabled
    border: '#27272a',               // Subtle border
    divider: '#27272a',
    success: '#10B981',              // Green
    warning: '#F59E0B',              // Amber
    error: '#EF4444',                // Red
    info: '#3B82F6',                 // Blue
    protein: '#3B82F6',              // Blue
    carbs: '#10B981',                // Green
    fats: '#8B5CF6',                 // Violet
    fiber: '#F59E0B',                // Amber
    water: '#0EA5E9',                // Sky Blue
    gradientPrimary: ['#06B6D4', '#3B82F6'],
    gradientDark: ['#121212', '#000000'],
    gradientAccent: ['#10B981', '#06B6D4'],
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
