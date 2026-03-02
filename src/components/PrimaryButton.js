import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, spacing, typography, colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const PrimaryButton = ({
    title,
    onPress,
    style,
    textStyle,
    variant = 'primary',
    size = 'large',
    disabled = false,
    loading = false,
    icon,
    gradientColors,
    onPressIn,
    onPressOut,
    onMouseEnter,
    onMouseLeave,
    ...props
}) => {
    const { theme } = useTheme();
    const [isHovered, setIsHovered] = React.useState(false);
    const [isPressed, setIsPressed] = React.useState(false);

    const flattenedStyle = StyleSheet.flatten(style) || {};
    const radius = flattenedStyle.borderRadius || 14;

    const getBackgroundColor = () => {
        if (disabled) return theme.textMuted;
        switch (variant) {
            case 'secondary': return '#222222';
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            case 'danger': return '#3A1F1F';
            default: return theme.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.textSecondary;
        switch (variant) {
            case 'primary': return '#FFFFFF';
            case 'secondary': return theme.primary;
            case 'outline': return theme.primary;
            case 'ghost': return theme.primary;
            case 'danger': return '#EF4444';
            default: return '#FFFFFF';
        }
    };

    const getHeight = () => {
        switch (size) {
            case 'small': return 40;
            case 'medium': return 48;
            default: return 56;
        }
    };

    const getBorderStyle = () => {
        if (variant === 'outline') {
            return {
                borderWidth: 1,
                borderColor: disabled ? theme.textMuted : theme.primary,
            };
        }
        if (variant === 'secondary') {
            return {
                borderWidth: 1,
                borderColor: theme.primary,
            };
        }
        return {};
    };

    const defaultGradient = gradientColors || theme.gradientPrimary;

    const ButtonContent = () => (
        <View style={[styles.content, { height: getHeight() }]}>
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon}
                    <Text style={[
                        styles.text,
                        { color: getTextColor() },
                        size === 'small' && { fontSize: 14 },
                        textStyle,
                    ]}>
                        {title}
                    </Text>
                </>
            )}
        </View>
    );

    const isInteractionActive = isHovered || isPressed;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'primary' && !disabled && {
                    ...Platform.select({
                        ios: {
                            shadowColor: theme.primary || '#000',
                            shadowOffset: { width: 0, height: isPressed ? 8 : 4 },
                            shadowOpacity: isPressed ? 0.6 : 0.3,
                            shadowRadius: isPressed ? 12 : 8,
                        },
                        android: {
                            elevation: isPressed ? 10 : 4,
                        },
                        web: {
                            cursor: 'pointer',
                            boxShadow: isInteractionActive
                                ? '0 12px 24px rgba(6, 182, 212, 0.4)'
                                : '0 4px 8px rgba(6, 182, 212, 0.2)',
                        }
                    }),
                },
                getBorderStyle(),
                style,
            ]}
            onPress={onPress}
            onPressIn={(e) => {
                setIsPressed(true);
                onPressIn?.(e);
            }}
            onPressOut={(e) => {
                setIsPressed(false);
                onPressOut?.(e);
            }}
            {...(Platform.OS === 'web' ? {
                onMouseEnter: (e) => {
                    setIsHovered(true);
                    onMouseEnter?.(e);
                },
                onMouseLeave: (e) => {
                    setIsHovered(false);
                    onMouseLeave?.(e);
                }
            } : {})}
            disabled={disabled || loading}
            activeOpacity={0.85}
            {...props}
        >
            {variant === 'primary' && !disabled ? (
                <LinearGradient
                    colors={defaultGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gradient, { borderRadius: radius }]}
                >
                    <ButtonContent />
                </LinearGradient>
            ) : (
                <View style={[
                    styles.buttonInner,
                    {
                        backgroundColor: getBackgroundColor(),
                        borderRadius: radius
                    }
                ]}>
                    <ButtonContent />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        overflow: 'hidden',
    },
    gradient: {
        width: '100%',
    },
    buttonInner: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    text: {
        fontSize: 16,
        fontWeight: '600', // Semi-bold for disciplined feel
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});

export default PrimaryButton;
