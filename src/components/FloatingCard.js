import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { borderRadius, spacing } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const FloatingCard = ({
    children,
    style,
    variant = 'default',
    padding = 'md',
    noPadding = false,
}) => {
    const { theme } = useTheme();

    const getPadding = () => {
        if (noPadding) return 0;
        switch (padding) {
            case 'sm': return spacing.sm;
            case 'lg': return spacing.lg;
            case 'xl': return spacing.xl;
            default: return spacing.md;
        }
    };

    const getBackgroundColor = () => {
        if (theme.isDark) {
            switch (variant) {
                case 'glass': return '#1C1C1C';
                case 'light': return '#222222';
                case 'primary': return theme.primary;
                default: return '#1C1C1C';
            }
        }
        return '#1C1C1C';
    };

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: getBackgroundColor(),
                padding: getPadding(),
                borderColor: '#2A2A2A',
                ...Platform.select({
                    ios: {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                    },
                    android: {
                        elevation: 2,
                    },
                }),
            },
            variant === 'glass' && { borderWidth: 1 },
            style,
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
    },
});

export default FloatingCard;
