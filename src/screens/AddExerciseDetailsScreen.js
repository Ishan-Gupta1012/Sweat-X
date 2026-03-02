import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import PrimaryButton from '../components/PrimaryButton';

const AddExerciseDetailsScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { exerciseName, onSave } = route.params;
    const styles = useMemo(() => createStyles(theme), [theme]);

    const isCardio = (exerciseName?.toLowerCase().includes('run') ||
        exerciseName?.toLowerCase().includes('walk') ||
        exerciseName?.toLowerCase().includes('cycle') ||
        exerciseName?.toLowerCase().includes('treadmill') ||
        exerciseName?.toLowerCase().includes('elliptical') ||
        route.params.category === 'cardio');

    const [numSets, setNumSets] = useState(isCardio ? 1 : 3);
    const [sets, setSets] = useState(
        Array.from({ length: isCardio ? 1 : 3 }, (_, i) => ({
            id: i + 1,
            weight: '',
            reps: '',
            time: '',
            intensity: 'Medium',
            restTime: isCardio ? '0' : '90',
            formRating: ''
        }))
    );

    const updateNumSets = (newNum) => {
        setNumSets(newNum);
        if (newNum > sets.length) {
            // Add more sets
            const newSets = [...sets];
            for (let i = sets.length; i < newNum; i++) {
                newSets.push({
                    id: i + 1,
                    weight: '',
                    reps: '',
                    time: '',
                    intensity: 'Medium',
                    restTime: isCardio ? '0' : '90',
                    formRating: ''
                });
            }
            setSets(newSets);
        } else {
            // Remove sets
            setSets(sets.slice(0, newNum));
        }
    };

    const updateSet = (setId, field, value) => {
        setSets(sets.map(set =>
            set.id === setId ? { ...set, [field]: value } : set
        ));
    };

    const handleSave = () => {
        const exercise = {
            id: Date.now(),
            name: exerciseName,
            category: isCardio ? 'cardio' : (route.params.category || 'strength'),
            sets: sets.map(s => ({ ...s, completed: false }))
        };
        navigation.navigate({
            name: 'WorkoutSession',
            params: { newExercise: exercise },
            merge: true,
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{exerciseName}</Text>
                    <Text style={styles.headerSubtitle}>Configure your sets</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Number of Sets Selector */}
                <Text style={styles.sectionLabel}>NUMBER OF SETS</Text>
                <View style={styles.setsRow}>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                        <TouchableOpacity
                            key={num}
                            style={[styles.setNumBtn, numSets === num && styles.setNumBtnActive]}
                            onPress={() => updateNumSets(num)}
                        >
                            <Text style={[styles.setNumText, numSets === num && styles.setNumTextActive]}>{num}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Sets Configuration */}
                <Text style={styles.sectionLabel}>SET DETAILS</Text>
                {sets.map((set, index) => (
                    <View key={set.id} style={styles.setCard}>
                        <View style={styles.setHeader}>
                            <Text style={styles.setLabel}>SET {set.id}</Text>
                        </View>

                        {/* Main Inputs: Weight & Reps OR Time & Intensity */}
                        <View style={styles.mainInputRow}>
                            {isCardio ? (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>TIME (MINS)</Text>
                                        <TextInput
                                            style={styles.mainInput}
                                            placeholder="0"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                            value={set.time}
                                            onChangeText={(v) => updateSet(set.id, 'time', v)}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>REPS/DIST</Text>
                                        <TextInput
                                            style={styles.mainInput}
                                            placeholder="0"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                            value={set.reps}
                                            onChangeText={(v) => updateSet(set.id, 'reps', v)}
                                        />
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>WEIGHT (KG)</Text>
                                        <TextInput
                                            style={styles.mainInput}
                                            placeholder="0"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                            value={set.weight}
                                            onChangeText={(v) => updateSet(set.id, 'weight', v)}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>REPS</Text>
                                        <TextInput
                                            style={styles.mainInput}
                                            placeholder="0"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                            value={set.reps}
                                            onChangeText={(v) => updateSet(set.id, 'reps', v)}
                                        />
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Secondary Inputs: Intensity (Cardio) OR Rest Time & Form (Strength) */}
                        {isCardio ? (
                            <View style={styles.secondaryInputRow}>
                                <View style={[styles.inputGroup]}>
                                    <Text style={styles.inputLabel}>INTENSITY</Text>
                                    <View style={styles.intensityRow}>
                                        {['Low', 'Med', 'High'].map((lvl) => (
                                            <TouchableOpacity
                                                key={lvl}
                                                style={[
                                                    styles.intensityBtn,
                                                    set.intensity === lvl && { backgroundColor: theme.brandWorkout, borderColor: theme.brandWorkout }
                                                ]}
                                                onPress={() => updateSet(set.id, 'intensity', lvl)}
                                            >
                                                <Text style={[
                                                    styles.intensityBtnText,
                                                    set.intensity === lvl && { color: '#FFF' }
                                                ]}>{lvl}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        ) : null}

                        {/* Secondary Inputs: Rest Time & Form (Hidden for Cardio) */}
                        {!isCardio && (
                            <View style={styles.secondaryInputRow}>
                                <View style={styles.smallInputGroup}>
                                    <Text style={styles.smallInputLabel}>Rest (s)</Text>
                                    <TextInput
                                        style={styles.smallInput}
                                        placeholder="90"
                                        placeholderTextColor={theme.textMuted}
                                        keyboardType="numeric"
                                        value={set.restTime}
                                        onChangeText={(v) => updateSet(set.id, 'restTime', v)}
                                    />
                                </View>
                                <View style={styles.smallInputGroup}>
                                    <Text style={styles.smallInputLabel}>Form (1-5)</Text>
                                    <TextInput
                                        style={styles.smallInput}
                                        placeholder="-"
                                        placeholderTextColor={theme.textMuted}
                                        keyboardType="numeric"
                                        maxLength={1}
                                        value={set.formRating}
                                        onChangeText={(v) => updateSet(set.id, 'formRating', v)}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <PrimaryButton
                    title="ADD TO WORKOUT"
                    onPress={handleSave}
                    style={styles.saveButton}
                />
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerInfo: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: theme.textPrimary, letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 11, color: theme.textMuted, marginTop: 2 },

    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

    sectionLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.textMuted,
        letterSpacing: 2,
        marginBottom: spacing.md,
        marginTop: spacing.lg
    },

    setsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg
    },
    setNumBtn: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: theme.cardBackground,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: theme.border
    },
    setNumBtnActive: {
        backgroundColor: theme.brandWorkout,
        borderColor: theme.brandWorkout
    },
    setNumText: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.textPrimary
    },
    setNumTextActive: {
        color: '#FFF'
    },

    setCard: {
        backgroundColor: theme.cardBackground,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1.5,
        borderColor: theme.border
    },
    setHeader: {
        marginBottom: spacing.md
    },
    setLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: theme.textSecondary,
        letterSpacing: 1
    },

    mainInputRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md
    },
    inputGroup: {
        flex: 1
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.textMuted,
        letterSpacing: 1,
        marginBottom: spacing.xs
    },
    mainInput: {
        height: 56,
        backgroundColor: theme.isDark ? '#0D0D0D' : theme.cardBackgroundLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        fontSize: 18,
        fontWeight: '800',
        color: theme.textPrimary,
        borderWidth: 1.5,
        borderColor: theme.border,
        textAlign: 'center'
    },
    intensityRow: {
        flexDirection: 'row',
        gap: 4,
        height: 56,
    },
    intensityBtn: {
        flex: 1,
        backgroundColor: theme.isDark ? '#0D0D0D' : theme.cardBackgroundLight,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: theme.border,
    },
    intensityBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.textSecondary,
    },

    secondaryInputRow: {
        flexDirection: 'row',
        gap: spacing.md
    },
    smallInputGroup: {
        flex: 1,
        alignItems: 'center'
    },
    smallInputLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.textMuted,
        marginBottom: spacing.xs
    },
    smallInput: {
        width: '100%',
        height: 44,
        backgroundColor: theme.isDark ? '#0D0D0D' : theme.cardBackgroundLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.sm,
        fontSize: 14,
        fontWeight: '700',
        color: theme.textPrimary,
        borderWidth: 1.5,
        borderColor: theme.border,
        textAlign: 'center'
    },

    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        backgroundColor: theme.background
    },
    saveButton: {
        paddingVertical: 16
    }
});

export default AddExerciseDetailsScreen;
