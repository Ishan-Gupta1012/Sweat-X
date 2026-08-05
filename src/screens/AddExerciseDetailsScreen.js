import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import PrimaryButton from '../components/PrimaryButton';
import ExerciseAnalyticsGraph from '../components/ExerciseAnalyticsGraph';

const AddExerciseDetailsScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { userData } = useUser();
    const { exerciseName, onSave } = route.params;
    const styles = useMemo(() => createStyles(theme), [theme]);

    const isCardio = (exerciseName?.toLowerCase().includes('run') ||
        exerciseName?.toLowerCase().includes('walk') ||
        exerciseName?.toLowerCase().includes('cycle') ||
        exerciseName?.toLowerCase().includes('treadmill') ||
        exerciseName?.toLowerCase().includes('elliptical') ||
        route.params.category === 'cardio');

    const [numSets, setNumSets] = useState(route.params.existingSets ? route.params.existingSets.length : (isCardio ? 1 : 3));
    const [sets, setSets] = useState(
        route.params.existingSets ? route.params.existingSets : Array.from({ length: isCardio ? 1 : 3 }, (_, i) => ({
            id: i + 1,
            weight: '',
            reps: '',
            time: '',
            intensity: 'Medium',
            restTime: isCardio ? '0' : '90',
            formRating: '',
            completed: false
        }))
    );

    const [globalRestTime, setGlobalRestTime] = useState(60);
    const [isResting, setIsResting] = useState(false);
    const [restTimer, setRestTimer] = useState(0);
    const restTimerRef = useRef(null);
    const restEndTimeRef = useRef(null);

    useEffect(() => {
        return () => {
            if (restTimerRef.current) clearInterval(restTimerRef.current);
        };
    }, []);

    const startRest = () => {
        setIsResting(true);
        setRestTimer(globalRestTime);
        restEndTimeRef.current = Date.now() + (globalRestTime * 1000);
        if (restTimerRef.current) clearInterval(restTimerRef.current);
        restTimerRef.current = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((restEndTimeRef.current - Date.now()) / 1000));
            if (remaining <= 0) {
                clearInterval(restTimerRef.current);
                setIsResting(false);
                setRestTimer(0);
            } else {
                setRestTimer(remaining);
            }
        }, 1000);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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

    const addDropSet = (setId) => {
        setSets(sets.map(set => {
            if (set.id === setId) {
                const dropSets = set.dropSets || [];
                return {
                    ...set,
                    dropSets: [...dropSets, { id: dropSets.length + 1, weight: '', reps: '' }]
                };
            }
            return set;
        }));
    };

    const removeDropSet = (setId, dropSetId) => {
        setSets(sets.map(set => {
            if (set.id === setId) {
                return { ...set, dropSets: (set.dropSets || []).filter(ds => ds.id !== dropSetId).map((ds, idx) => ({ ...ds, id: idx + 1 })) };
            }
            return set;
        }));
    };

    const updateDropSet = (setId, dropSetId, field, value) => {
        setSets(sets.map(set => {
            if (set.id === setId) {
                return { ...set, dropSets: (set.dropSets || []).map(ds => ds.id === dropSetId ? { ...ds, [field]: value } : ds) };
            }
            return set;
        }));
    };


    const toggleSetComplete = (setId) => {
        setSets(sets.map(set => {
            if (set.id === setId) {
                const newCompleted = !set.completed;
                if (newCompleted && !isCardio) startRest();
                return { ...set, completed: newCompleted };
            }
            return set;
        }));
    };

    const handleSave = () => {
        const exercise = {
            id: route.params?.existingExerciseId || Date.now(),
            name: exerciseName,
            category: isCardio ? 'cardio' : (route.params.category || 'strength'),
            sets: route.params?.origin === 'WorkoutSession' ? sets : sets.map(s => ({ ...s, completed: false }))
        };

        if (route.params?.origin === 'CreateCustomSplit') {
            import('react-native').then(({ DeviceEventEmitter }) => {
                DeviceEventEmitter.emit('onAddExerciseToSplit', exercise);
                navigation.goBack();
            });
        } else if (route.params?.origin === 'WorkoutSession') {
            import('react-native').then(({ DeviceEventEmitter }) => {
                DeviceEventEmitter.emit('onUpdateExerciseInSession', exercise);
                navigation.goBack();
            });
        } else {
            import('react-native').then(({ DeviceEventEmitter }) => {
                DeviceEventEmitter.emit('onAddExerciseToSession', exercise);
                navigation.goBack();
            });
        }
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

            {/* Global Rest Time Setting */}
            {!isCardio && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.background }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textMuted, letterSpacing: 1 }}>REST TIMER</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                        {[60, 120, 180, 240, 300].map(time => (
                            <TouchableOpacity
                                key={time}
                                onPress={() => setGlobalRestTime(time)}
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 12,
                                    backgroundColor: globalRestTime === time ? theme.brandWorkout : theme.cardBackground,
                                    borderWidth: 1,
                                    borderColor: globalRestTime === time ? theme.brandWorkout : theme.border
                                }}
                            >
                                <Text style={{ fontSize: 12, fontWeight: '700', color: globalRestTime === time ? '#FFF' : theme.textPrimary }}>{time / 60}m</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Analytics Graph */}
                {!isCardio && (
                    <View style={{ marginHorizontal: -spacing.lg }}>
                        <ExerciseAnalyticsGraph 
                            exerciseName={exerciseName} 
                            workoutHistory={userData?.workoutHistory || []} 
                        />
                    </View>
                )}

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
                    <View key={set.id} style={[styles.setCard, set.completed && { opacity: 0.6 }]}>
                        <View style={styles.setHeader}>
                            <TouchableOpacity 
                                style={[styles.setCheckBtn, set.completed && { backgroundColor: theme.brandWorkout, borderColor: theme.brandWorkout }]} 
                                onPress={() => toggleSetComplete(set.id)}
                            >
                                {set.completed && <Ionicons name="checkmark" size={20} color="#000" />}
                            </TouchableOpacity>
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

                        {/* Drop Sets Section */}
                        {(set.dropSets || []).map((dropSet) => (
                            <View key={`drop-${dropSet.id}`} style={[styles.dropSetCard, { backgroundColor: theme.warning + '12' }]}>
                                <View style={styles.dropSetHeader}>
                                    <View style={[styles.dropSetTag, { backgroundColor: theme.warning + '25' }]}>
                                        <Text style={[styles.dropSetTagText, { color: theme.warning }]}>DROP {dropSet.id}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeDropSet(set.id, dropSet.id)} style={styles.dropSetRemoveBtn}>
                                        <Ionicons name="close-circle" size={20} color={theme.error} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.dropSetInputRow}>
                                    <View style={styles.dropSetInputGroup}>
                                        <TextInput
                                            style={[styles.dropSetInput, { backgroundColor: theme.cardBackground, color: theme.textPrimary, borderColor: theme.warning + '40' }]}
                                            placeholder="0"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                            value={dropSet.weight}
                                            onChangeText={(v) => updateDropSet(set.id, dropSet.id, 'weight', v)}
                                        />
                                        <Text style={[styles.dropSetInputLabel, { color: theme.warning }]}>KG</Text>
                                    </View>
                                    <View style={styles.dropSetInputGroup}>
                                        <TextInput
                                            style={[styles.dropSetInput, { backgroundColor: theme.cardBackground, color: theme.textPrimary, borderColor: theme.warning + '40' }]}
                                            placeholder="0"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                            value={dropSet.reps}
                                            onChangeText={(v) => updateDropSet(set.id, dropSet.id, 'reps', v)}
                                        />
                                        <Text style={[styles.dropSetInputLabel, { color: theme.warning }]}>REPS</Text>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Add Drop Set Button */}
                        {!isCardio && (
                            <TouchableOpacity
                                style={[styles.addDropSetBtn, { borderColor: theme.warning + '50' }]}
                                onPress={() => addDropSet(set.id)}
                            >
                                <Ionicons name="add" size={14} color={theme.warning} />
                                <Text style={[styles.addDropSetText, { color: theme.warning }]}>Add Drop Set</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Floating Rest Timer */}
            {isResting && (
                <View style={[styles.stickyRestTimer, { backgroundColor: theme.cardBackground, borderColor: theme.brandWorkout, borderWidth: 1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Ionicons name="timer-outline" size={28} color={theme.brandWorkout} />
                            <Text style={[styles.stickyRestTimeText, { color: theme.brandWorkout }]}>{formatTime(restTimer)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <TouchableOpacity onPress={() => {
                                const currentRemaining = Math.max(0, Math.ceil((restEndTimeRef.current - Date.now()) / 1000));
                                const newTime = Math.max(0, currentRemaining - 15);
                                restEndTimeRef.current = Date.now() + (newTime * 1000);
                                setRestTimer(newTime);
                                if (newTime === 0) { setIsResting(false); if (restTimerRef.current) clearInterval(restTimerRef.current); }
                            }} style={styles.smallAdjustBtn}>
                                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>-15s</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                                const currentRemaining = Math.max(0, Math.ceil((restEndTimeRef.current - Date.now()) / 1000));
                                const newTime = currentRemaining + 15;
                                restEndTimeRef.current = Date.now() + (newTime * 1000);
                                setRestTimer(newTime);
                            }} style={styles.smallAdjustBtn}>
                                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>+15s</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                                setIsResting(false);
                                if (restTimerRef.current) clearInterval(restTimerRef.current);
                            }}>
                                <Ionicons name="close-circle" size={32} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <PrimaryButton
                    title={route.params?.origin === 'WorkoutSession' ? "SAVE SETS" : "ADD TO WORKOUT"}
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
        borderWidth: 1,
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
        borderWidth: 1,
        borderColor: theme.border
    },
    setHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: spacing.md
    },
    setCheckBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center'
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        fontSize: 18,
        fontWeight: '800',
        color: theme.textPrimary,
        borderWidth: 1,
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
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

    footer: { padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 32 : spacing.lg, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.border },
    saveButton: { borderRadius: borderRadius.pill },
    stickyRestTimer: { position: 'absolute', bottom: 100, left: 20, right: 20, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, zIndex: 100 },
    stickyRestTimeText: { fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
    dropSetCard: { marginTop: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FFB70320' },
    dropSetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dropSetTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    dropSetTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    dropSetRemoveBtn: { padding: 4 },
    dropSetInputRow: { flexDirection: 'row', gap: 12 },
    dropSetInputGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, paddingRight: 12 },
    dropSetInput: { flex: 1, height: 40, paddingHorizontal: 12, fontSize: 14, fontWeight: '600', borderWidth: 0, borderRightWidth: 1 },
    dropSetInputLabel: { fontSize: 10, fontWeight: '700', marginLeft: 12 },
    addDropSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8 },
    addDropSetText: { fontSize: 12, fontWeight: '600' },
    smallAdjustBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8
    }
});

export default AddExerciseDetailsScreen;
