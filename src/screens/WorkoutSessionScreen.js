import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '../constants/colors';
import FloatingCard from '../components/FloatingCard';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import geminiService from '../services/gemini';
import { API_URL } from '../services/api';
// Workout library removed in favor of DB search



const WorkoutSessionScreen = ({ navigation, route }) => {
    const { saveWorkout, userData, saveActiveWorkout, clearActiveWorkout, deleteActiveWorkout } = useUser();
    const { theme, isDarkMode } = useTheme();
    const { title = 'Workout Session', zones = [], split = null, exerciseLimit = 10, recommendedRest = 60, preloadedExercises = [], skipTimeModal = true, resumeSession = false } = route?.params || {};

    const [timer, setTimer] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [restTimer, setRestTimer] = useState(0);
    const [showSubstituteModal, setShowSubstituteModal] = useState(false);
    const [substitutionOptions, setSubstitutionOptions] = useState([]);
    const [isSubstituting, setIsSubstituting] = useState(false);
    const [substituteTargetExercise, setSubstituteTargetExercise] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedSets, setSelectedSets] = useState(3);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [customExercise, setCustomExercise] = useState('');
    const [showFormGuide, setShowFormGuide] = useState(false);
    const [formGuideData, setFormGuideData] = useState(null);

    // Smart Split Check: If we have pre-populated exercises, it's a Smart Split
    const isSmartSplit = preloadedExercises && preloadedExercises.length > 0;

    // Time selection modal state (Bypassing permanently as requested)
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedTime, setSelectedTime] = useState(60);
    const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);
    const [workoutStarted, setWorkoutStarted] = useState(true);
    const [isFinishing, setIsFinishing] = useState(false);

    const timerRef = useRef(null);
    const restTimerRef = useRef(null);
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Initialize exercises from preloaded data if available
    const [exercises, setExercises] = useState(() => {
        if (isSmartSplit) {
            return preloadedExercises.map((ex, idx) => ({
                id: idx + 1,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                category: ex.category,
                type: ex.type,
                restSeconds: ex.type === 'compound' ? 90 : 60,
                setsCompleted: 0,
                isCompleted: false
            }));
        }
        return [];
    });
    const [availableExercises, setAvailableExercises] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [expandedExercises, setExpandedExercises] = useState({});

    // Fetch exercises from DB
    const fetchExercises = async (query = '', category = '') => {
        setIsLoadingSuggestions(true);
        try {
            let url = `${API_URL}/exercises`;
            if (query) {
                url = `${API_URL}/exercises/search/${query}`;
            } else if (category) {
                url = `${API_URL}/exercises/category/${category}`;
            } else if (split) {
                // Map split to categories
                const categories = split === 'push' ? 'chest' : split === 'pull' ? 'back' : 'legs';
                // We'll just fetch one primary category to start
                url = `${API_URL}/exercises/category/${categories}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setAvailableExercises(data.exercises);
            }
        } catch (error) {
            console.error('Failed to fetch exercises', error);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    // Load initial suggestions when modal opens
    useEffect(() => {
        if (showAddModal) {
            fetchExercises('', zones[0] || (split === 'push' ? 'chest' : split === 'pull' ? 'back' : 'legs'));
        }
    }, [showAddModal]);

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (customExercise.trim()) {
                fetchExercises(customExercise);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [customExercise]);

    // Load saved workout session on mount if resuming
    useEffect(() => {
        if (resumeSession && userData.activeWorkoutSession) {
            const saved = userData.activeWorkoutSession;
            setExercises(saved.exercises || []);
            setTimer(saved.timer || 0);
            setWorkoutStarted(true);
            setShowTimeModal(false);
            console.log('📥 Resuming workout session:', saved.title);
        }
    }, []); // Only run on mount

    // Auto-save workout state whenever it changes
    // Handle exercise returning from details screen
    useEffect(() => {
        if (route.params?.newExercise) {
            const exerciseToAdd = route.params.newExercise;
            setExercises(prev => [...prev, exerciseToAdd]);
            // Clear the param immediately using setParams on the current route
            navigation.setParams({ newExercise: undefined });
        }
    }, [route.params?.newExercise]);

    useEffect(() => {
        if (workoutStarted && exercises.length > 0 && !isFinishing) {
            saveActiveWorkout({
                title,
                zones,
                split,
                exerciseLimit,
                exercises,
                timer,
                timestamp: new Date().toISOString(),
            });
        }
    }, [exercises, timer, workoutStarted]); // Save when exercises or timer changes

    // Only start timer after time is selected
    useEffect(() => {
        if (!workoutStarted) return;
        timerRef.current = setInterval(() => { setTimer((prev) => prev + 1); }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (restTimerRef.current) clearInterval(restTimerRef.current);
        };
    }, [workoutStarted]);

    // Load routine based on selected time
    const loadRoutine = async (time) => {
        setIsLoadingRoutine(true);
        try {
            const { exerciseApi } = require('../services/api');
            const result = await exerciseApi.getRoutine(
                zones,
                time,
                userData?.trainingLevel || 'beginner'
            );

            if (result.success && result.routine && result.routine.length > 0) {
                // Format exercises with IDs and completion status
                const formattedExercises = result.routine.map((ex, idx) => ({
                    id: idx + 1,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    category: ex.category,
                    type: ex.type,
                    restSeconds: ex.restSeconds,
                    setsCompleted: 0,
                    isCompleted: false
                }));
                setExercises(formattedExercises);
            }
        } catch (error) {
            console.error('Failed to load routine:', error);
        } finally {
            setIsLoadingRoutine(false);
            setWorkoutStarted(true);
            setShowTimeModal(false);
        }
    };

    // Start substitution - moved inside component scope
    const startSubstitution = async (exerciseName, id) => {
        setSubstituteTargetExercise({ name: exerciseName, id });
        setShowSubstituteModal(true);
        setIsSubstituting(true);
        setSubstitutionOptions([]);

        try {
            // Step 1: Find the exercise details (category + type)
            const searchRes = await fetch(`${API_URL}/exercises/search/${encodeURIComponent(exerciseName)}`);
            const searchData = await searchRes.json();

            let targetCategory = '';
            let targetType = '';

            if (searchData.success && searchData.exercises.length > 0) {
                const exactMatch = searchData.exercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
                if (exactMatch) {
                    targetCategory = exactMatch.category;
                    targetType = exactMatch.type;
                } else {
                    targetCategory = searchData.exercises[0].category;
                    targetType = searchData.exercises[0].type;
                }
            }

            // Step 2: Fetch and Filter
            if (targetCategory) {
                const catRes = await fetch(`${API_URL}/exercises/category/${targetCategory}`);
                const catData = await catRes.json();

                if (catData.success) {
                    // strict match: category + type (e.g. Chest + Compound)
                    let candidates = catData.exercises.filter(e =>
                        e.name.toLowerCase() !== exerciseName.toLowerCase() &&
                        (!targetType || e.type === targetType)
                    );

                    // If not enough strict matches, loosen to just category
                    if (candidates.length < 3) {
                        const others = catData.exercises.filter(e =>
                            e.name.toLowerCase() !== exerciseName.toLowerCase() &&
                            e.type !== targetType
                        );
                        candidates = [...candidates, ...others];
                    }

                    // Deduplicate and Shuffle
                    const uniqueCandidates = [...new Set(candidates.map(c => c.name))];
                    const shuffled = uniqueCandidates.sort(() => 0.5 - Math.random());
                    setSubstitutionOptions(shuffled.slice(0, 3));
                    setIsSubstituting(false);
                    return;
                }
            }

            // Fallback
            setSubstitutionOptions(['Push Ups', 'Burpees', 'Jumping Jacks']);
        } catch (error) {
            console.error("Substitution error:", error);
            setSubstitutionOptions(['Push Ups', 'Burpees', 'Jumping Jacks']);
        } finally {
            setIsSubstituting(false);
        }
    };

    const openFormGuide = async (exerciseName) => {
        try {
            const res = await fetch(`${API_URL}/exercises/search/${encodeURIComponent(exerciseName)}`);
            const data = await res.json();
            if (data.success && data.exercises.length > 0) {
                const ex = data.exercises[0];
                setFormGuideData({
                    name: ex.name,
                    description: ex.description || 'Focus on controlled movements and full range of motion.',
                    videoUrl: ex.videoUrl
                });
                setShowFormGuide(true);
            } else {
                setFormGuideData({
                    name: exerciseName,
                    description: 'No specific guide found. Focus on slow, controlled movements and proper breathing.',
                    videoUrl: null
                });
                setShowFormGuide(true);
                Alert.alert("Note", "Detailed guide not available, showing general tips.");
            }
        } catch (error) {
            console.error("Form guide error:", error);
        }
    };

    const applySubstitution = (newName) => {
        if (!substituteTargetExercise) return;

        // Log the swap
        const timestamp = new Date().toISOString();
        console.log(`[SWAP LOG] ${timestamp}: Swapped "${substituteTargetExercise.name}" with "${newName}"`);

        // Update state
        setExercises(exercises.map(ex => ex.id === substituteTargetExercise.id ? { ...ex, name: newName } : ex));

        setShowSubstituteModal(false);

        // Show Toast (Simple Alert for V1)
        Alert.alert("Success", "Exercise swapped successfully");
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRest = (duration = recommendedRest) => {
        setIsResting(true);
        setRestTimer(duration);
        if (restTimerRef.current) clearInterval(restTimerRef.current);
        restTimerRef.current = setInterval(() => {
            setRestTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(restTimerRef.current);
                    setIsResting(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const skipRest = () => {
        if (restTimerRef.current) clearInterval(restTimerRef.current);
        setIsResting(false);
        setRestTimer(0);
    };

    const addExercise = (exerciseName, numSets) => {
        if (!exerciseName.trim()) return;

        if (exercises.length >= exerciseLimit) {
            Alert.alert(
                "Limit Reached",
                `Your current plan recommends a limit of ${exerciseLimit} exercises for safety and optimal recovery at your level. Try to focus on quality over quantity.`
            );
            return;
        }

        const newExercise = {
            id: Date.now(),
            name: exerciseName.trim(),
            sets: Array.from({ length: numSets }, (_, i) => ({ id: i + 1, weight: '', reps: '', restTime: '', formRating: '', completed: false })),
        };
        setExercises([...exercises, newExercise]);
        closeModal();
    };

    const closeModal = () => {
        setShowAddModal(false);
        setSelectedExercise(null);
        setSelectedSets(3);
        setCustomExercise('');
    };

    const toggleExerciseExpand = (exerciseId) => {
        setExpandedExercises(prev => ({
            ...prev,
            [exerciseId]: !prev[exerciseId]
        }));
    };

    const deleteExercise = (exerciseId) => { setExercises(exercises.filter(e => e.id !== exerciseId)); };

    const updateSet = (exerciseId, setId, field, value) => {
        setExercises(exercises.map(exercise => {
            if (exercise.id === exerciseId) {
                return { ...exercise, sets: Array.isArray(exercise.sets) ? exercise.sets.map(set => set.id === setId ? { ...set, [field]: value } : set) : [] };
            }
            return exercise;
        }));
    };

    const toggleSetComplete = (exerciseId, setId) => {
        setExercises(exercises.map(exercise => {
            if (exercise.id === exerciseId) {
                return {
                    ...exercise,
                    sets: Array.isArray(exercise.sets) ? exercise.sets.map(set => {
                        if (set.id === setId) {
                            const newCompleted = !set.completed;
                            if (newCompleted && exercise.category !== 'cardio') startRest();
                            return { ...set, completed: newCompleted };
                        }
                        return set;
                    }) : [],
                };
            }
            return exercise;
        }));
    };

    const addSet = (exerciseId) => {
        setExercises(exercises.map(exercise => {
            if (exercise.id === exerciseId) {
                const setsArray = Array.isArray(exercise.sets) ? exercise.sets : [];
                const newSetId = setsArray.length + 1;
                return { ...exercise, sets: [...setsArray, { id: newSetId, weight: '', reps: '', restTime: '', formRating: '', completed: false }] };
            }
            return exercise;
        }));
    };

    const removeSet = (exerciseId) => {
        setExercises(exercises.map(exercise => {
            if (exercise.id === exerciseId && Array.isArray(exercise.sets) && exercise.sets.length > 1) {
                return { ...exercise, sets: exercise.sets.slice(0, -1) };
            }
            return exercise;
        }));
    };

    const addDropSet = (exerciseId, setId) => {
        setExercises(exercises.map(exercise => {
            if (exercise.id === exerciseId) {
                return {
                    ...exercise,
                    sets: Array.isArray(exercise.sets) ? exercise.sets.map(set => {
                        if (set.id === setId) {
                            const dropSets = set.dropSets || [];
                            return {
                                ...set,
                                dropSets: [...dropSets, { id: dropSets.length + 1, weight: '', reps: '' }]
                            };
                        }
                        return set;
                    }) : []
                };
            }
            return exercise;
        }));
    };

    const updateDropSet = (exerciseId, setId, dropSetId, field, value) => {
        setExercises(exercises.map(exercise => {
            if (exercise.id === exerciseId) {
                return {
                    ...exercise,
                    sets: Array.isArray(exercise.sets) ? exercise.sets.map(set => {
                        if (set.id === setId) {
                            return {
                                ...set,
                                dropSets: (set.dropSets || []).map(ds =>
                                    ds.id === dropSetId ? { ...ds, [field]: value } : ds
                                )
                            };
                        }
                        return set;
                    }) : []
                };
            }
            return exercise;
        }));
    };

    const removeDropSet = (exerciseId, setId, dropSetId) => {
        setExercises(exercises.map(exercise => {
            if (exercise.id === exerciseId) {
                return {
                    ...exercise,
                    sets: Array.isArray(exercise.sets) ? exercise.sets.map(set => {
                        if (set.id === setId) {
                            return {
                                ...set,
                                dropSets: (set.dropSets || []).filter(ds => ds.id !== dropSetId)
                            };
                        }
                        return set;
                    }) : []
                };
            }
            return exercise;
        }));
    };

    const handleFinishWorkout = async () => {
        setIsFinishing(true);
        // A set is considered completed if it was explicitly checked off, OR if the user entered valid data into it (like reps or time)
        const isSetCompleted = (s) => s.completed || parseInt(s.reps) > 0 || parseInt(s.time) > 0;

        const completedExercises = exercises.filter(ex => Array.isArray(ex.sets) && ex.sets.some(s => isSetCompleted(s)));
        const completedSets = exercises.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.filter(s => isSetCompleted(s)).length : 0), 0);
        if (completedExercises.length > 0) {
            const workoutData = {
                title, zones, split, duration: timer,
                exercises: completedExercises.map(ex => ({
                    name: ex.name,
                    sets: Array.isArray(ex.sets) ? ex.sets.filter(s => isSetCompleted(s)).map(s => ({
                        weight: parseInt(s.weight) || 0,
                        reps: parseInt(s.reps) || 0,
                        time: parseInt(s.time) || 0,
                        intensity: s.intensity || '',
                        restTime: parseInt(s.restTime) || 0,
                        formRating: parseInt(s.formRating) || 0
                    })) : [],
                })),
                totalSets: completedSets,
            };
            try {
                const response = await fetch(`${API_URL}/calories/workout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ exercises: workoutData.exercises, cardio: null, userWeight: userData.currentWeight || 75 }),
                });
                if (response.ok) {
                    const data = await response.json();
                    workoutData.caloriesBurned = data.totalCalories;
                    console.log('🔥 [WorkoutSession] Calories Calculated:', data.totalCalories);
                    console.log('📊 [WorkoutSession] Breakdown:', JSON.stringify(data.breakdown));
                }
            } catch (error) {
                workoutData.caloriesBurned = Math.round(timer / 60 * 5);
            }
            saveWorkout(workoutData);
        }
        // Clear the active workout session after finishing
        console.log('🏁 [WorkoutSession] Finishing workout, clearing session');
        clearActiveWorkout();
        console.log('🚀 [WorkoutSession] Navigating to MainApp');
        navigation.navigate('MainApp');
    };

    const handleDeleteWorkout = () => {
        console.log('🗑️ Delete workout button pressed');

        // Web doesn't support Alert.alert properly, use confirm instead
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Are you sure you want to abandon this workout? All progress will be lost.');
            if (confirmed) {
                setIsFinishing(true);
                console.log('🗑️ Deleting active workout session (web)');
                deleteActiveWorkout();
                console.log('✅ Active workout deleted, navigating to Dashboard');
                navigation.navigate('MainApp');
            } else {
                console.log('Delete cancelled (web)');
            }
        } else {
            // Mobile platforms
            Alert.alert(
                'Delete Workout?',
                'Are you sure you want to abandon this workout? All progress will be lost.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => console.log('Delete cancelled')
                    },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                            setIsFinishing(true);
                            console.log('🗑️ Deleting active workout session (mobile)');
                            deleteActiveWorkout();
                            navigation.navigate('MainApp');
                        }
                    }
                ],
                { cancelable: true }
            );
        }
    };



    const completedSets = exercises.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.filter(s => s.completed).length : 0), 0);
    const totalSets = exercises.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />



            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.headerSubtitle}>{completedSets}/{totalSets} sets completed</Text>
                </View>
                <View style={styles.timerBadge}>
                    <Ionicons name="time" size={12} color={theme.brandWorkout} />
                    <Text style={[styles.timerText, { color: theme.brandWorkout }]}>{formatTime(timer)}</Text>
                </View>
            </View>

            {/* Rest Timer Overlay */}
            {isResting && (
                <View style={styles.restOverlay}>
                    <View style={styles.restCard}>
                        <Text style={styles.restTitle}>Rest Time</Text>
                        <Text style={styles.restTimer}>{formatTime(restTimer)}</Text>
                        <TouchableOpacity style={styles.skipButton} onPress={skipRest}>
                            <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>Skip</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Add Exercise Modal */}
            <Modal visible={showAddModal} animationType="fade" transparent={true} onRequestClose={closeModal}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={styles.modalTitle}>Add Exercise</Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={22} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.exerciseListContainer}>
                            <View style={styles.customInputRow}>
                                <TextInput
                                    style={[styles.customInput, { backgroundColor: theme.cardBackgroundLight, color: theme.textPrimary }]}
                                    placeholder="Or type your own exercise..."
                                    placeholderTextColor={theme.textMuted}
                                    value={customExercise}
                                    onChangeText={setCustomExercise}
                                />
                                {!!customExercise.trim() && (
                                    <TouchableOpacity
                                        style={[styles.customAddBtn, { backgroundColor: theme.brandWorkout }]}
                                        onPress={() => {
                                            closeModal();
                                            navigation.navigate('AddExerciseDetails', {
                                                exerciseName: customExercise.trim(),
                                                category: 'strength' // Default for custom, unless matches
                                            });
                                        }}
                                    >
                                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={styles.suggestionsLabel}>Suggestions</Text>
                            <ScrollView style={styles.exerciseScroll} showsVerticalScrollIndicator={false}>
                                {availableExercises.map((ex, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.exerciseOption, { borderBottomColor: theme.border }]}
                                        onPress={() => {
                                            closeModal();
                                            navigation.navigate('AddExerciseDetails', {
                                                exerciseName: ex.name,
                                                category: ex.category
                                            });
                                        }}
                                    >
                                        <Text style={[styles.exerciseOptionText, { color: theme.textPrimary }]}>{ex.name}</Text>
                                        <Ionicons name="add" size={18} color={theme.brandWorkout} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Substitution Modal */}
            {/* Substitution Modal (Bottom Sheet) */}
            <Modal visible={showSubstituteModal} animationType="slide" transparent={true} onRequestClose={() => setShowSubstituteModal(false)}>
                <TouchableOpacity style={styles.bottomSheetOverlay} activeOpacity={1} onPress={() => setShowSubstituteModal(false)}>
                    <TouchableOpacity activeOpacity={1} style={[styles.bottomSheetContent, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.bottomSheetHeader}>
                            <View>
                                <Text style={styles.bottomSheetTitle}>Swap Exercise</Text>
                                <Text style={styles.bottomSheetSubtitle}>Same muscle, same benefit</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowSubstituteModal(false)}>
                                <Ionicons name="close-circle" size={30} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {isSubstituting ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={theme.brandWorkout} />
                                <Text style={{ color: theme.textSecondary, marginTop: 16 }}>Finding alternatives...</Text>
                            </View>
                        ) : (
                            <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ paddingBottom: 20 }}>
                                {substitutionOptions.map((opt, i) => (
                                    <TouchableOpacity key={i} style={[styles.swapOption, { borderBottomColor: theme.border }]} onPress={() => applySubstitution(opt)}>
                                        <View style={styles.swapOptionLeft}>
                                            <View style={[styles.swapIcon, { backgroundColor: theme.cardBackgroundLight }]}>
                                                <Ionicons name="barbell" size={20} color={theme.brandWorkout} />
                                            </View>
                                            <View>
                                                <Text style={[styles.swapOptionText, { color: theme.textPrimary }]}>{opt}</Text>
                                                <Text style={[styles.swapOptionSub, { color: theme.textSecondary }]}>Same muscle group</Text>
                                            </View>
                                        </View>
                                        <Ionicons name="arrow-forward-circle" size={24} color={theme.brandWorkout} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Form Guide Modal */}
            <Modal visible={showFormGuide} animationType="slide" transparent={true} onRequestClose={() => setShowFormGuide(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={styles.modalTitle}>Form Guide</Text>
                            <TouchableOpacity onPress={() => setShowFormGuide(false)}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 24 }}>
                            <Text style={[styles.formGuideName, { color: theme.brandWorkout }]}>{formGuideData?.name}</Text>
                            <View style={[styles.videoPlaceholder, { backgroundColor: theme.cardBackgroundLight }]}>
                                {formGuideData?.videoUrl ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <Ionicons name="play-circle" size={64} color={theme.brandWorkout} />
                                        <Text style={{ color: theme.textSecondary, marginTop: 12, fontWeight: '700' }}>Video demonstration active</Text>
                                    </View>
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Ionicons name="videocam-off" size={64} color={theme.textMuted} />
                                        <Text style={{ color: theme.textMuted, marginTop: 12, fontWeight: '700' }}>No video available</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.formGuideDesc, { color: theme.textSecondary }]}>{formGuideData?.description}</Text>

                            <View style={styles.tipBox}>
                                <Ionicons name="information-circle" size={20} color={theme.brandWorkout} />
                                <Text style={styles.tipText}>Focus on deep breathing and controlled descent.</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {exercises.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="barbell-outline" size={50} color={theme.textMuted} />
                        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No exercises yet</Text>
                        <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>Tap below to add exercises</Text>
                    </View>
                ) : (
                    exercises.map((exercise) => {
                        const isExpanded = expandedExercises[exercise.id];
                        const completedSets = Array.isArray(exercise.sets) ? exercise.sets.filter(s => s.completed).length : 0;
                        const totalSets = Array.isArray(exercise.sets) ? exercise.sets.length : 0;

                        return (
                            <View key={exercise.id} style={styles.exerciseCard}>
                                <TouchableOpacity
                                    style={styles.exerciseHeader}
                                    onPress={() => toggleExerciseExpand(exercise.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.exerciseHeaderLeft}>
                                        <Ionicons
                                            name={isExpanded ? "chevron-down" : "chevron-forward"}
                                            size={20}
                                            color={theme.textMuted}
                                        />
                                        <View style={styles.exerciseInfo}>
                                            <Text style={[styles.exerciseName, { color: theme.textPrimary }]} numberOfLines={1}>{exercise.name}</Text>
                                            <Text style={styles.exerciseProgress}>{completedSets}/{totalSets} sets</Text>
                                        </View>
                                    </View>
                                    <View style={styles.exerciseHeaderRight}>
                                        <TouchableOpacity onPress={() => openFormGuide(exercise.name)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                            <Ionicons name="play-circle" size={20} color={theme.brandWorkout} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => startSubstitution(exercise.name, exercise.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                            <Ionicons name="swap-horizontal" size={22} color={theme.brandWorkout} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteExercise(exercise.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                            <Ionicons name="trash-outline" size={18} color={theme.error} />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View style={styles.setsContainer}>
                                        {Array.isArray(exercise.sets) && exercise.sets.map((set) => (
                                            <View key={set.id} style={[styles.setCard, { backgroundColor: isDarkMode ? theme.background : theme.cardBackgroundLight }]}>
                                                {/* Row 1: Set Info & Checkbox */}
                                                <View style={styles.setCardHeader}>
                                                    <View style={styles.setTag}>
                                                        <Text style={[styles.setTagText, { color: theme.textSecondary }]}>SET {set.id}</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={[styles.setCheckBtn, set.completed && { backgroundColor: theme.brandWorkout, borderColor: theme.brandWorkout }]}
                                                        onPress={() => toggleSetComplete(exercise.id, set.id)}
                                                    >
                                                        {set.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                                                        {!set.completed && <View style={[styles.checkCircle, { borderColor: theme.textMuted }]} />}
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={styles.performanceRow}>
                                                    {exercise.category === 'cardio' ? (
                                                        <>
                                                            <View style={styles.inputGroup}>
                                                                <TextInput
                                                                    style={[styles.bigInput, { backgroundColor: theme.cardBackground, color: theme.textPrimary }]}
                                                                    placeholder="0"
                                                                    placeholderTextColor={theme.textMuted}
                                                                    keyboardType="numeric"
                                                                    value={set.time}
                                                                    onChangeText={(v) => updateSet(exercise.id, set.id, 'time', v)}
                                                                    editable={!set.completed}
                                                                />
                                                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>MINS</Text>
                                                            </View>
                                                            <View style={styles.inputGroup}>
                                                                <TextInput
                                                                    style={[styles.bigInput, { backgroundColor: theme.cardBackground, color: theme.textPrimary }]}
                                                                    placeholder="0"
                                                                    placeholderTextColor={theme.textMuted}
                                                                    keyboardType="numeric"
                                                                    value={set.reps}
                                                                    onChangeText={(v) => updateSet(exercise.id, set.id, 'reps', v)}
                                                                    editable={!set.completed}
                                                                />
                                                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>REPS/DIST</Text>
                                                            </View>
                                                            <View style={styles.inputGroup}>
                                                                <TouchableOpacity
                                                                    style={styles.intensityDisplay}
                                                                    onPress={() => {
                                                                        const levels = ['Low', 'Med', 'High'];
                                                                        const current = set.intensity || 'Med';
                                                                        const next = levels[(levels.indexOf(current) + 1) % levels.length];
                                                                        updateSet(exercise.id, set.id, 'intensity', next);
                                                                    }}
                                                                    disabled={set.completed}
                                                                >
                                                                    <Text style={[styles.intensityValue, { color: theme.brandWorkout }]}>{set.intensity || 'Med'}</Text>
                                                                </TouchableOpacity>
                                                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>INTENSITY</Text>
                                                            </View>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <View style={styles.inputGroup}>
                                                                <TextInput
                                                                    style={[styles.bigInput, { backgroundColor: theme.cardBackground, color: theme.textPrimary }]}
                                                                    placeholder="0"
                                                                    placeholderTextColor={theme.textMuted}
                                                                    keyboardType="numeric"
                                                                    value={set.weight}
                                                                    onChangeText={(v) => updateSet(exercise.id, set.id, 'weight', v)}
                                                                    editable={!set.completed}
                                                                />
                                                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>KG</Text>
                                                            </View>
                                                            <View style={styles.inputGroup}>
                                                                <TextInput
                                                                    style={[styles.bigInput, { backgroundColor: theme.cardBackground, color: theme.textPrimary }]}
                                                                    placeholder="0"
                                                                    placeholderTextColor={theme.textMuted}
                                                                    keyboardType="numeric"
                                                                    value={set.reps}
                                                                    onChangeText={(v) => updateSet(exercise.id, set.id, 'reps', v)}
                                                                    editable={!set.completed}
                                                                />
                                                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>REPS</Text>
                                                            </View>
                                                        </>
                                                    )}
                                                </View>

                                                {/* Row 3: Quality Inputs (Smaller) - Hidden for Cardio */}
                                                {exercise.category !== 'cardio' && (
                                                    <View style={[styles.qualityRow, { borderTopColor: theme.border }]}>
                                                        <View style={styles.qualityInputWrapper}>
                                                            <Text style={[styles.qualityLabel, { color: theme.textMuted }]}>Rest (s):</Text>
                                                            <TextInput
                                                                style={[styles.smallInput, { color: theme.textPrimary }]}
                                                                placeholder="90"
                                                                placeholderTextColor={theme.textMuted}
                                                                keyboardType="numeric"
                                                                value={set.restTime}
                                                                onChangeText={(v) => updateSet(exercise.id, set.id, 'restTime', v)}
                                                                editable={!set.completed}
                                                            />
                                                        </View>
                                                    </View>
                                                )}

                                                {/* Drop Sets Section */}
                                                {(set.dropSets || []).map((dropSet) => (
                                                    <View key={`drop-${dropSet.id}`} style={[styles.dropSetCard, { backgroundColor: theme.warning + '12' }]}>
                                                        <View style={styles.dropSetHeader}>
                                                            <View style={[styles.dropSetTag, { backgroundColor: theme.warning + '25' }]}>
                                                                <Text style={[styles.dropSetTagText, { color: theme.warning }]}>DROP {dropSet.id}</Text>
                                                            </View>
                                                            <TouchableOpacity onPress={() => removeDropSet(exercise.id, set.id, dropSet.id)} style={styles.dropSetRemoveBtn}>
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
                                                                    onChangeText={(v) => updateDropSet(exercise.id, set.id, dropSet.id, 'weight', v)}
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
                                                                    onChangeText={(v) => updateDropSet(exercise.id, set.id, dropSet.id, 'reps', v)}
                                                                />
                                                                <Text style={[styles.dropSetInputLabel, { color: theme.warning }]}>REPS</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                ))}

                                                {/* Add Drop Set Button - Only for non-cardio */}
                                                {!set.completed && exercise.category !== 'cardio' && (
                                                    <TouchableOpacity
                                                        style={[styles.addDropSetBtn, { borderColor: theme.warning + '50' }]}
                                                        onPress={() => addDropSet(exercise.id, set.id)}
                                                    >
                                                        <Ionicons name="add" size={14} color={theme.warning} />
                                                        <Text style={[styles.addDropSetText, { color: theme.warning }]}>Add Drop Set</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}

                <TouchableOpacity style={[styles.addExerciseBtn, { borderColor: theme.brandWorkout + '50' }]} onPress={() => setShowAddModal(true)}>
                    <Ionicons name="add-circle" size={20} color={theme.brandWorkout} />
                    <Text style={[styles.addExerciseBtnText, { color: theme.brandWorkout }]}>Add Exercise</Text>
                </TouchableOpacity>

                {/* AI Prompt */}
                <TouchableOpacity
                    style={styles.aiPrompt}
                    onPress={() => navigation.navigate('AIChat', {
                        initialMessage: "I'm in the middle of a workout. Can you help me decide what exercise to do next or check my form?"
                    })}
                >
                    <Ionicons name="sparkles" size={14} color={theme.brandWorkout} />
                    <Text style={[styles.aiPromptText, { color: theme.textSecondary }]}>
                        Not sure what to lift today? <Text style={{ color: theme.brandWorkout, fontWeight: '700' }}>Ask TrueGuide</Text>
                    </Text>
                </TouchableOpacity>

            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <TouchableOpacity style={styles.restBtn} onPress={() => startRest()}>
                    <Ionicons name="timer" size={18} color={theme.textPrimary} />
                    <Text style={[styles.restBtnText, { color: theme.textPrimary }]}>Rest</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.finishBtn, { backgroundColor: theme.brandWorkout }]} onPress={handleFinishWorkout}>
                    <Text style={[styles.finishBtnText, { color: isDarkMode ? theme.textPrimary : theme.background }]}>Finish</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: theme.error + '20', borderColor: theme.error }]} onPress={handleDeleteWorkout}>
                    <Ionicons name="trash-outline" size={18} color={theme.error} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
    backButton: { width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: theme.cardBackgroundLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.border },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: theme.textPrimary, letterSpacing: 1, textTransform: 'uppercase' },
    headerSubtitle: { fontSize: 12, color: theme.textMuted, fontWeight: '700' },
    timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.cardBackground, paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: theme.brandWorkout + '30' },
    timerText: { color: theme.brandWorkout, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    restOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100, alignItems: 'center', justifyContent: 'center' },
    restCard: { backgroundColor: theme.cardBackground, padding: 32, borderRadius: borderRadius.md, alignItems: 'center', width: '80%', borderWidth: 2, borderColor: theme.brandWorkout },
    restTitle: { fontSize: 14, color: theme.brandWorkout, marginBottom: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
    restTimer: { fontSize: 64, fontWeight: '900', color: theme.brandWorkout, marginBottom: 24, letterSpacing: 2 },
    skipButton: { paddingVertical: 10, paddingHorizontal: 32, backgroundColor: theme.cardBackgroundLight, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: theme.border },
    skipButtonText: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 12, paddingBottom: 24 },
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '900', marginTop: 16, color: theme.textPrimary, letterSpacing: 1 },
    emptySubtitle: { fontSize: 14, marginTop: 8, color: theme.textMuted, fontWeight: '600' },
    exerciseCard: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: theme.border },
    exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, paddingBottom: 16 },
    exerciseHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    exerciseHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    exerciseInfo: { flex: 1 },
    exerciseProgress: { fontSize: 11, color: theme.textMuted, fontWeight: '600', marginTop: 2 },
    exerciseName: { fontSize: 16, fontWeight: '900', color: theme.textPrimary, letterSpacing: 0.5, textTransform: 'uppercase' },
    setsContainer: { gap: 12, marginBottom: 12 },
    setCard: { borderRadius: borderRadius.md, padding: 12 },
    setCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    setTag: { backgroundColor: theme.brandWorkout + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    setTagText: { fontSize: 10, fontWeight: '900', color: theme.brandWorkout, letterSpacing: 1 },
    setCheckBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
    performanceRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    inputGroup: { flex: 1, alignItems: 'center' },
    bigInput: { width: '100%', height: 56, borderRadius: borderRadius.md, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 6, borderWidth: 1.5 },
    inputLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    qualityRow: { flexDirection: 'row', paddingTop: 10, borderTopWidth: 1.5, alignItems: 'center' },
    qualityInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    qualityLabel: { fontSize: 12, fontWeight: '700' },
    smallInput: { width: 44, height: 28, padding: 0, fontSize: 14, fontWeight: '900', textAlign: 'center' },
    intensityDisplay: { width: '100%', height: 56, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.cardBackground, borderWidth: 1.5, borderColor: theme.border },
    intensityValue: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
    verticalDivider: { width: 1.5, height: 16 },
    addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, borderWidth: 2, borderStyle: 'dashed', marginBottom: 12 },
    addExerciseBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    aiPrompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, paddingVertical: 12, backgroundColor: theme.cardBackgroundLight, borderRadius: borderRadius.md },
    aiPromptText: { fontSize: 13, fontWeight: '600' },
    footer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1.5, gap: 12, backgroundColor: theme.background },
    restBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, height: 56, backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: theme.border },
    restBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, height: 56, backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: theme.border },
    addBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    deleteBtn: { width: 56, height: 56, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
    finishBtn: { flex: 1, height: 56, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', shadowColor: theme.brandWorkout, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    finishBtnText: { fontSize: 16, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { borderRadius: borderRadius.md, width: '100%', maxHeight: '85%', borderWidth: 1.5, borderColor: theme.border, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1.5 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: theme.textPrimary, letterSpacing: 1, textTransform: 'uppercase' },
    exerciseListContainer: { padding: 16 },
    customInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    customInput: { flex: 1, height: 50, borderRadius: borderRadius.md, paddingHorizontal: 16, fontSize: 14, fontWeight: '600', borderWidth: 1.5, borderColor: theme.border },
    customAddBtn: { width: 50, height: 50, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
    suggestionsLabel: { fontSize: 12, color: theme.textMuted, marginBottom: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
    exerciseScroll: { maxHeight: 250 },
    exerciseOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1.5 },
    exerciseOptionText: { fontSize: 15, fontWeight: '700' },
    setsSelector: { padding: 32, alignItems: 'center' },
    selectedExName: { fontSize: 20, fontWeight: '900', marginBottom: 20, color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
    setsLabel: { fontSize: 14, marginBottom: 16, fontWeight: '700' },
    setsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    setNumBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.border },
    setNumText: { fontSize: 16, fontWeight: '900' },
    confirmBtn: { width: '100%', height: 56, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
    confirmBtnText: { fontSize: 16, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    cardioHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, padding: 16, marginVertical: 12, gap: 12, borderWidth: 1.5, borderColor: theme.border },
    cardioHeaderText: { flex: 1, fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    cardioCard: { padding: 16, marginBottom: 16, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: theme.border },
    cardioLabel: { fontSize: 12, marginBottom: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: theme.textMuted },
    cardioTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    cardioTypeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: theme.border },
    cardioTypeBtnText: { fontSize: 12, fontWeight: '700' },
    cardioInput: { height: 48, borderRadius: borderRadius.md, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1.5, borderColor: theme.border, fontWeight: '700' },
    intensityRow: { flexDirection: 'row', gap: 8 },
    intensityBtn: { flex: 1, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.border },
    intensityBtnText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    bottomSheetContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: 350, borderWidth: 1.5, borderBottomWidth: 0, borderColor: theme.border },
    bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    bottomSheetTitle: { fontSize: 24, fontWeight: '900', color: theme.textPrimary, letterSpacing: 1, textTransform: 'uppercase' },
    bottomSheetSubtitle: { fontSize: 14, color: theme.textMuted, marginTop: 4, fontWeight: '700' },
    container: { flex: 1, backgroundColor: theme.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.background,
    },
    backButton: { padding: 8, marginRight: 8 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary },
    headerSubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.cardBackground,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    timerText: { fontSize: 14, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

    restOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    restCard: {
        backgroundColor: theme.cardBackground,
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        width: '80%',
        borderWidth: 1,
        borderColor: theme.brandWorkout,
    },
    restTitle: { fontSize: 14, fontWeight: '600', color: theme.brandWorkout, letterSpacing: 2, marginBottom: 16 },
    restTimer: { fontSize: 64, fontWeight: '700', color: theme.textPrimary, marginBottom: 24 },
    skipButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: '#222222' },
    skipButtonText: { fontSize: 14, fontWeight: '600' },

    scrollView: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: 100 },

    exerciseCard: {
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    exerciseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
    },
    exerciseHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    exerciseInfo: { marginLeft: 12, flex: 1 },
    exerciseName: { fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
    exerciseProgress: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    exerciseHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },

    setsContainer: { padding: spacing.lg, paddingTop: 0, gap: 12 },
    setCard: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.background,
    },
    setCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    setTag: { backgroundColor: '#222222', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    setTagText: { fontSize: 10, fontWeight: '600' },
    setCheckBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },

    performanceRow: { flexDirection: 'row', gap: 16 },
    inputGroup: { flex: 1, alignItems: 'center' },
    bigInput: { width: '100%', height: 50, borderRadius: 12, textAlign: 'center', fontSize: 20, fontWeight: '700' },
    inputLabel: { fontSize: 10, fontWeight: '600', marginTop: 6, letterSpacing: 1 },

    secondaryMetrics: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border, gap: 16 },
    qualityInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    qualityLabel: { fontSize: 11, fontWeight: '500' },
    smallInput: { fontSize: 16, fontWeight: '600', textAlign: 'center', width: 24 },
    verticalDivider: { width: 1, height: 20 },

    addSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginTop: 4, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.brandWorkout },
    addSetText: { fontSize: 12, fontWeight: '600', color: theme.brandWorkout },

    finishButton: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 56, borderRadius: 28, backgroundColor: theme.brandWorkout, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    finishButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 1 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: spacing.xl },
    modalContent: { borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: theme.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary },

    exerciseListContainer: { height: 400 },
    customInputRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    customInput: { flex: 1, height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 15 },
    customAddBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    suggestionsLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    exerciseOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
    exerciseOptionText: { fontSize: 15, fontWeight: '500' },

    bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
    bottomSheetContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.xl, paddingBottom: 40, borderWidth: 1, borderBottomWidth: 0, borderColor: theme.border },
    bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    bottomSheetTitle: { fontSize: 20, fontWeight: '600', color: theme.textPrimary },
    bottomSheetSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },

    swapOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1.5 },
    swapOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    swapIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
    swapOptionText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
    swapOptionSub: { fontSize: 12, fontWeight: '400' },

    formGuideName: { fontSize: 24, fontWeight: '600', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
    formGuideDesc: { fontSize: 16, lineHeight: 24, fontWeight: '400', marginBottom: 24 },
    videoPlaceholder: { width: '100%', height: 200, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1.5 },
    tipBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1.5 },
    tipText: { flex: 1, fontSize: 14, fontWeight: '500' },

    // Time Selection Modal Styles
    timeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    timeModalContent: { width: '100%', maxWidth: 400, backgroundColor: '#151515', borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: theme.border },
    timeModalHeader: { alignItems: 'center', marginBottom: spacing.xl },
    timeModalTitle: { fontSize: 20, fontWeight: '600', color: theme.textPrimary, marginTop: spacing.md, textAlign: 'center' },
    timeModalSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: spacing.sm, fontWeight: '400', textAlign: 'center' },
    timeOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    timeOption: { width: '47%', padding: spacing.lg, backgroundColor: theme.cardBackground, borderRadius: 16, borderWidth: 2, borderColor: theme.border, alignItems: 'center' },
    timeOptionSelected: { borderColor: theme.brandWorkout, backgroundColor: theme.brandWorkout + '15' },
    timeOptionLabel: { fontSize: 22, fontWeight: '700', color: theme.textSecondary },
    timeOptionLabelSelected: { color: theme.brandWorkout },
    timeOptionDesc: { fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginTop: 4 },
    timeOptionExercises: { fontSize: 10, fontWeight: '400', color: theme.textSecondary, marginTop: 4 },
    startWorkoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: spacing.md },
    startWorkoutButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF', letterSpacing: 2 },
    skipTimeButton: { alignItems: 'center', paddingVertical: 12 },
    skipTimeButtonText: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
});


export default WorkoutSessionScreen;
