import React, { useMemo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, spacing, typography } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const SelectableCard = ({
    title,
    subtitle,
    icon,
    iconName,
    selected = false,
    onPress,
    style,
    size = 'medium',
    showCheckmark = true,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const getHeight = () => {
        switch (size) {
            case 'small': return 56;
            case 'large': return 100;
            default: return 72;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.card,
                selected && styles.cardSelected,
                { minHeight: getHeight() },
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                {iconName && (
                    <View style={[
                        styles.iconContainer,
                        selected && styles.iconContainerSelected,
                    ]}>
                        <Ionicons
                            name={iconName}
                            size={24}
                            color={selected ? '#FFFFFF' : theme.primary}
                        />
                    </View>
                )}
                {icon && (
                    <View style={[
                        styles.iconContainer,
                        selected && styles.iconContainerSelected,
                    ]}>
                        {icon}
                    </View>
                )}
                <View style={styles.textContainer}>
                    <Text style={[
                        styles.title,
                        selected && styles.titleSelected,
                    ]}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    )}
                </View>
            </View>
            {showCheckmark && (
                <View style={[
                    styles.checkbox,
                    selected && styles.checkboxSelected,
                ]}>
                    {selected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const createStyles = (theme) => StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1C1C1C',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#2A2A2A',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    cardSelected: {
        borderColor: theme.primary,
        backgroundColor: '#222222',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#222222',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    iconContainerSelected: {
        backgroundColor: theme.primary,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#F5F5F5',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    titleSelected: {
        color: theme.primary,
    },
    subtitle: {
        color: '#A1A1A1',
        fontSize: 12,
        marginTop: 2,
        fontWeight: '400',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#2A2A2A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
});

export default SelectableCard;
