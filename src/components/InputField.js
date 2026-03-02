import React, { useMemo, useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, Animated, Platform } from 'react-native';
import { borderRadius, spacing, typography as typographyConstants } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const InputField = ({
    label,
    placeholder,
    value,
    onChangeText,
    style,
    inputStyle,
    keyboardType = 'default',
    secureTextEntry = false,
    multiline = false,
    numberOfLines = 1,
    leftIcon,
    rightIcon,
    error,
    helperText,
    autoCapitalize = 'none',
    ...props
}) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
        setIsFocused(true);
        Animated.timing(focusAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.timing(focusAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.border, theme.primary],
    });

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={[styles.label, isFocused && { color: theme.primary }]}>{label}</Text>}
            <Animated.View style={[
                styles.inputWrapper,
                { borderColor: error ? theme.error : borderColor },
                isFocused && !error && {
                    borderColor: '#FF6B00',
                    boxShadow: Platform.OS === 'web' ? `0 0 0 1px #FF6B00` : 'none',
                }
            ]}>
                {leftIcon && (
                    <View style={styles.leftIconContainer}>
                        {leftIcon}
                    </View>
                )}

                <TextInput
                    style={[
                        styles.input,
                        Platform.OS === 'web' && {
                            outline: 'none',
                            // Deeper web fix for autofill styling locally
                            WebkitBoxShadow: '0 0 0 1000px transparent inset !important'
                        },
                        inputStyle,
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textMuted}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    keyboardAppearance="dark"
                    autoCapitalize={autoCapitalize}
                    selectionColor={theme.primary}
                    {...props}
                />

                {rightIcon && (
                    <View style={styles.rightIconContainer}>
                        {rightIcon}
                    </View>
                )}
            </Animated.View>
            {(error || helperText) && (
                <Text style={[styles.helperText, error && styles.errorText]}>
                    {error || helperText}
                </Text>
            )}
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        marginBottom: spacing.md,
        width: '100%',
    },
    label: {
        color: theme.textSecondary,
        fontSize: 11,
        fontWeight: '800',
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1C', // Card Background
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        minHeight: 56,
        paddingHorizontal: spacing.md,
    },
    leftIconContainer: {
        marginRight: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        width: 24,
    },
    rightIconContainer: {
        marginLeft: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        width: 24,
    },
    input: {
        flex: 1,
        color: '#F5F5F5', // Soft White
        fontSize: 16,
        fontWeight: '400',
        paddingVertical: spacing.md,
        height: '100%',
        width: '100%',
    },
    helperText: {
        color: theme.textMuted,
        fontSize: 12,
        marginTop: spacing.xs,
        fontWeight: '500',
    },
    errorText: {
        color: theme.error,
    },
});

export default InputField;

