// Premium OLED & Neon Theme
// Clean, high-contrast, modern fitness aesthetic

export const colors = {
  // Background colors - Pure OLED Blacks
  background: '#000000',              // Absolute Black
  secondaryBackground: '#09090B',      // Slightly elevated black (Zinc 950)
  cardBackground: '#121212',          // Standard dark surface
  cardBackgroundLight: '#18181b',     // Elevated Surface 
  surfaceSelected: '#27272a',         // Focus/Selected surface

  // Primary accent - Electric Cyan (Default/Dashboard)
  primary: '#06B6D4',                 // Vibrant Cyan (Primary Accent)
  primaryDark: '#0891B2',             // Dark Cyan (hover/pressed)
  primaryLight: '#22D3EE',            // Secondary Accent
  primaryLighter: '#67E8F9',          // Light Accent

  // Screen-Specific Brand Colors (Multi-color Premium UI)
  brandWorkout: '#8B5CF6',            // Vibrant Violet for Workouts
  brandNutrition: '#10B981',          // Emerald Green for Food/Nutrition
  brandProfile: '#F43F5E',            // Rose Red for Profile/Settings
  brandDashboard: '#06B6D4',          // Electric Cyan for Home/Dashboard
  brandAI: '#6366F1',                 // Indigo for CoreCoach AI Assistant

  // Text colors - High-contrast whites
  textPrimary: '#FAFAFA',             // Bright White
  textSecondary: '#E4E4E7',           // Soft White
  textMuted: '#A1A1AA',               // Muted Grey
  textDisabled: '#71717A',            // Disabled Text

  // Borders and dividers - Subtle lines
  border: '#27272a',                  // Zinc 800
  divider: '#27272a',

  // Status colors - Standardized
  success: '#10B981',                 // Emerald Green
  warning: '#F59E0B',                 // Amber
  error: '#EF4444',                   // Rose Red
  info: '#3B82F6',                    // Blue

  // Macro colors - Distinct & Vibrant
  protein: '#3B82F6',                 // Blue
  carbs: '#10B981',                   // Green
  fats: '#8B5CF6',                    // Violet
  fiber: '#F59E0B',                   // Amber
  water: '#0EA5E9',                   // Sky Blue

  // Gradients
  gradientPrimary: ['#06B6D4', '#3B82F6'], // Cyan to Blue
  gradientDark: ['#121212', '#000000'],
  gradientAccent: ['#10B981', '#06B6D4'],  // Green to Cyan
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  hero: {
    fontSize: 48,
    fontWeight: '600',
    letterSpacing: 2,
  },
  h1: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 1,
  },
  h2: {
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  neonGlow: {
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
};
