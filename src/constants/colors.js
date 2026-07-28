// Premium OLED & Neon Theme
// Clean, high-contrast, modern fitness aesthetic

export const colors = {
  // Background colors - Pitch Black & Sleek Dark
  background: '#000000',              // Absolute black
  secondaryBackground: '#0A0F0C',     // Very dark grey/green hint
  cardBackground: 'rgba(255, 255, 255, 0.05)',  // Sleek translucent surface
  cardBackgroundLight: 'rgba(255, 255, 255, 0.1)', // Slightly lighter
  surfaceSelected: 'rgba(82, 183, 136, 0.15)',    // Subtle green highlight

  // Primary accent - Neon Green Theme
  primary: '#2D6A4F',
  primaryDark: '#1B4332',
  primaryLight: '#40916C',
  primaryLighter: '#52B788',
  accent: '#52B788',
  highlight: '#95D5B2',

  // Screen-Specific Brand Colors
  brandWorkout: '#52B788',
  brandNutrition: '#40916C',
  brandProfile: '#95D5B2',
  brandDashboard: '#2D6A4F',
  brandAI: '#40916C',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA', // Neutral gray
  textMuted: '#71717A',     // Darker neutral gray
  textDisabled: '#52525B',

  // UI elements
  border: 'rgba(255, 255, 255, 0.1)',
  divider: 'rgba(255, 255, 255, 0.05)',

  // Semantic
  success: '#52B788',
  warning: '#F4A261',
  error: '#EF4444',
  info: '#2D6A4F',

  // Macro colors
  protein: '#52B788',
  carbs: '#40916C',
  fats: '#95D5B2',
  fiber: '#F4A261',
  water: '#3B82F6',

  // Gradients
  gradientPrimary: ['#0A0F0C', '#000000'],
  gradientDark: ['#1B4332', '#081C15'],
  gradientAccent: ['#52B788', '#95D5B2'],
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
