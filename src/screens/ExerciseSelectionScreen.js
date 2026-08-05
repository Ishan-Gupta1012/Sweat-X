import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/colors';
import { API_URL } from '../services/api';

const ExerciseSelectionScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { origin, isSubstitute = false, targetExercise = null, zones = [], split = null } = route.params || {};

    const [customExercise, setCustomExercise] = useState('');
    const [availableExercises, setAvailableExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const styles = useMemo(() => createStyles(theme), [theme]);

    const fetchExercises = async (query = '', category = '', type = '') => {
        setIsLoading(true);
        try {
            let url = `${API_URL}/exercises`;
            if (query) {
                url = `${API_URL}/exercises/search/${encodeURIComponent(query)}`;
            } else if (category) {
                url = `${API_URL}/exercises/category/${category}`;
            } else if (split) {
                const categories = split === 'push' ? 'chest' : split === 'pull' ? 'back' : 'legs';
                url = `${API_URL}/exercises/category/${categories}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                let exercises = data.exercises || [];
                if (isSubstitute && targetExercise) {
                    // filter logic for substitutes
                    let candidates = exercises.filter(e => e.name.toLowerCase() !== targetExercise.name.toLowerCase() && (!type || e.type === type));
                    if (candidates.length < 3) {
                        const others = exercises.filter(e => e.name.toLowerCase() !== targetExercise.name.toLowerCase() && e.type !== type);
                        candidates = [...candidates, ...others];
                    }
                    const uniqueCandidates = [...new Map(candidates.map(item => [item.name, item])).values()];
                    exercises = uniqueCandidates.sort(() => 0.5 - Math.random()).slice(0, 3);
                }
                setAvailableExercises(exercises);
            }
        } catch (error) {
            console.error('Failed to fetch exercises', error);
            if (isSubstitute) {
                setAvailableExercises([{name: 'Push Ups', category: 'strength', type: 'compound'}, {name: 'Burpees', category: 'strength', type: 'compound'}]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isSubstitute && targetExercise) {
            // Find category and type of the target exercise to get substitutes
            const initSubstitute = async () => {
                setIsLoading(true);
                try {
                    const searchRes = await fetch(`${API_URL}/exercises/search/${encodeURIComponent(targetExercise.name)}`);
                    const searchData = await searchRes.json();
                    
                    let targetCategory = '';
                    let targetType = '';
                    
                    if (searchData.success && searchData.exercises.length > 0) {
                        const exactMatch = searchData.exercises.find(e => e.name.toLowerCase() === targetExercise.name.toLowerCase());
                        if (exactMatch) {
                            targetCategory = exactMatch.category;
                            targetType = exactMatch.type;
                        } else {
                            targetCategory = searchData.exercises[0].category;
                            targetType = searchData.exercises[0].type;
                        }
                    }
                    
                    if (targetCategory && targetType) {
                        fetchExercises('', targetCategory, targetType);
                    } else {
                        fetchExercises('', 'chest', 'compound');
                    }
                } catch (e) {
                    setIsLoading(false);
                }
            };
            initSubstitute();
        } else {
            fetchExercises('', zones[0] || (split === 'push' ? 'chest' : split === 'pull' ? 'back' : 'legs'));
        }
    }, []);

    useEffect(() => {
        if (!isSubstitute) {
            const delayDebounceFn = setTimeout(() => {
                if (customExercise.trim()) {
                    fetchExercises(customExercise);
                } else {
                    fetchExercises('', zones[0] || (split === 'push' ? 'chest' : split === 'pull' ? 'back' : 'legs'));
                }
            }, 300);

            return () => clearTimeout(delayDebounceFn);
        }
    }, [customExercise]);

    const handleSelectExercise = (item) => {
        if (isSubstitute) {
            const { DeviceEventEmitter } = require('react-native');
            DeviceEventEmitter.emit('onSubstituteExercise', {
                targetId: targetExercise.id,
                newExercise: {
                    name: item.displayName || item.name,
                    category: item.category,
                    type: item.type
                }
            });
            navigation.goBack();
        } else {
            navigation.navigate('AddExerciseDetails', {
                exerciseName: item.displayName || item.name,
                category: item.category,
                origin: origin || 'WorkoutSession'
            });
        }
    };

    const handleAddCustom = () => {
        if (customExercise.trim()) {
            if (isSubstitute) {
                const { DeviceEventEmitter } = require('react-native');
                DeviceEventEmitter.emit('onSubstituteExercise', {
                    targetId: targetExercise.id,
                    newExercise: {
                        name: customExercise.trim(),
                        category: 'strength',
                        type: 'isolation'
                    }
                });
                navigation.goBack();
            } else {
                navigation.navigate('AddExerciseDetails', {
                    exerciseName: customExercise.trim(),
                    category: 'strength',
                    origin: origin || 'WorkoutSession'
                });
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isSubstitute ? 'Substitute Exercise' : 'Add Exercise'}</Text>
            </View>

            <View style={styles.content}>
                {isSubstitute && targetExercise && (
                    <View style={styles.substituteTargetCard}>
                        <Text style={styles.substituteTargetLabel}>Replacing</Text>
                        <Text style={styles.substituteTargetName}>{targetExercise.name}</Text>
                    </View>
                )}

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.textPrimary }]}
                        placeholder="Search or type custom exercise..."
                        placeholderTextColor={theme.textMuted}
                        value={customExercise}
                        onChangeText={setCustomExercise}
                    />
                    {!!customExercise.trim() && (
                        <TouchableOpacity
                            style={[styles.customAddBtn, { backgroundColor: theme.brandWorkout }]}
                            onPress={handleAddCustom}
                        >
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.suggestionsLabel}>
                    {isSubstitute ? 'Recommended Alternatives' : 'Suggestions'}
                </Text>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.brandWorkout} />
                    </View>
                ) : (
                    <ScrollView style={styles.exerciseScroll} showsVerticalScrollIndicator={false}>
                        {availableExercises.map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.exerciseOption}
                                onPress={() => handleSelectExercise(item)}
                            >
                                <View style={styles.exerciseOptionContent}>
                                    <Text style={[styles.exerciseOptionText, { color: theme.textPrimary }]}>
                                        {item.displayName || item.name}
                                    </Text>
                                    <Text style={[styles.exerciseOptionSub, { color: theme.textSecondary }]}>
                                        {item.category} • {item.type}
                                    </Text>
                                </View>
                                <Ionicons name={isSubstitute ? "swap-horizontal" : "add-circle"} size={24} color={theme.brandWorkout} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    content: { flex: 1, padding: spacing.lg },
    substituteTargetCard: {
        backgroundColor: theme.cardBackground,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: theme.border
    },
    substituteTargetLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
    substituteTargetName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.cardBackgroundLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
        height: 56,
        borderWidth: 1,
        borderColor: theme.border
    },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, fontSize: 16, height: '100%' },
    customAddBtn: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    suggestionsLabel: { fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    exerciseScroll: { flex: 1 },
    exerciseOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
    },
    exerciseOptionContent: { flex: 1 },
    exerciseOptionText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    exerciseOptionSub: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
});

export default ExerciseSelectionScreen;
