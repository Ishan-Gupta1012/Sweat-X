import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Dimensions, Animated, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import PrimaryButton from '../components/PrimaryButton';

const { width } = Dimensions.get('window');

const WorkoutSelectionScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { userData, deleteCustomSplit } = useUser();
    const plan = userData?.trainingPlan;

    const [viewMode, setViewMode] = useState(plan ? 'active' : 'selection'); // 'active' or 'selection'
    const [showPlanModal, setShowPlanModal] = useState(false);

    const styles = useMemo(() => createStyles(theme), [theme]);

    const bodyParts = [
        { id: 'chest', label: 'Chest', icon: 'shield-outline' },
        { id: 'back', label: 'Back', icon: 'reorder-four-outline' },
        { id: 'shoulders', label: 'Shoulders', icon: 'triangle-outline' },
        { id: 'biceps', label: 'Biceps', icon: 'barbell-outline' },
        { id: 'triceps', label: 'Triceps', icon: 'flash-outline' },
        { id: 'legs', label: 'Legs', icon: 'walk-outline' },
        { id: 'abs', label: 'Abs', icon: 'grid-outline' },
        { id: 'arms', label: 'Full Arms', icon: 'body-outline' },
        { id: 'cardio', label: 'Cardio', icon: 'fitness-outline' },
    ];

    const handleStartWorkout = (title, zones, exerciseLimit, preloadedExercises = []) => {
        navigation.navigate('WorkoutSession', {
            title: title || 'Quick Session',
            zones: zones || [],
            exerciseLimit,
            preloadedExercises,
            skipTimeModal: true
        });
    };

    const getTodaySession = () => {
        if (!plan) return null;
        const today = new Date().getDay(); // 0-6 (Sun-Sat)
        const sessionIdx = (today === 0 ? 6 : today - 1) % plan.schedule.length;
        return plan.schedule[sessionIdx];
    };

    const todaySession = getTodaySession();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>WORKOUT</Text>
                <TouchableOpacity style={styles.headerAction} onPress={() => setViewMode(viewMode === 'active' ? 'selection' : 'active')}>
                    <Ionicons name={viewMode === 'active' ? 'apps-outline' : 'list-outline'} size={24} color={theme.brandWorkout} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {viewMode === 'active' && plan ? (
                    <>
                        {/* 1. Today's Workout Focus */}
                        <Text style={styles.sectionLabel}>TODAY'S WORKOUT</Text>
                        <TouchableOpacity
                            style={styles.todayCard}
                            onPress={() => todaySession && handleStartWorkout(todaySession.title, todaySession.zones, todaySession.exerciseLimit, todaySession.exercises)}
                        >
                            <View style={styles.todayContent}>
                                <View style={styles.todayInfo}>
                                    <Text style={styles.todayTag}>CURRENT PROTOCOL</Text>
                                    <Text style={styles.todayTitle}>{todaySession?.title || 'REST DAY'}</Text>
                                    <Text style={styles.todayZones}>{todaySession?.zones.join(' • ').toUpperCase() || 'RECOVERY MODE'}</Text>
                                </View>
                                <View style={styles.startButton}>
                                    <View style={[styles.startGradient, { backgroundColor: theme.brandWorkout }]}>
                                        <Ionicons name="play" size={20} color="#FFF" />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* 2. My Training Split */}
                        <Text style={styles.sectionLabel}>MY TRAINING SPLIT</Text>
                        <View style={styles.splitMenu}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => setShowPlanModal(true)}>
                                <View style={styles.menuIcon}>
                                    <Ionicons name="eye-outline" size={20} color={theme.brandWorkout} />
                                </View>
                                <View style={styles.menuText}>
                                    <Text style={styles.menuTitle}>View Split</Text>
                                    <Text style={styles.menuSubText}>{plan.splitType} • {plan.daysPerWeek} Days/Week</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                            </TouchableOpacity>

                            <View style={styles.menuDivider} />

                            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BeginnerSetup')}>
                                <View style={styles.menuIcon}>
                                    <Ionicons name="create-outline" size={20} color={theme.brandWorkout} />
                                </View>
                                <View style={styles.menuText}>
                                    <Text style={styles.menuTitle}>Edit Split</Text>
                                    <Text style={styles.menuSubText}>Modify current frequency or level</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                            </TouchableOpacity>

                            <View style={styles.menuDivider} />

                            <TouchableOpacity style={styles.menuItem} onPress={() => setViewMode('selection')}>
                                <View style={styles.menuIcon}>
                                    <Ionicons name="add-circle-outline" size={20} color={theme.brandWorkout} />
                                </View>
                                <View style={styles.menuText}>
                                    <Text style={styles.menuTitle}>Create New Split</Text>
                                    <Text style={styles.menuSubText}>Switch to a different program</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* 4. Body Part Sessions (Always accessible) */}
                        <Text style={styles.sectionLabel}>BODY PART SESSIONS</Text>
                        <View style={styles.zonesGrid}>
                            {bodyParts.map((part) => (
                                <TouchableOpacity
                                    key={part.id}
                                    style={styles.zoneCard}
                                    onPress={() => handleStartWorkout(part.label, [part.id])}
                                >
                                    <View style={styles.zoneIcon}>
                                        <Ionicons name={part.icon} size={18} color={theme.brandWorkout} />
                                    </View>
                                    <Text style={styles.zoneLabel}>{part.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                ) : (
                    <>
                        {/* 2. Normal Workouts (Body Parts) */}
                        <Text style={styles.sectionLabel}>BODY PART SESSIONS</Text>
                        <View style={styles.zonesGrid}>
                            {bodyParts.map((part) => (
                                <TouchableOpacity
                                    key={part.id}
                                    style={styles.zoneCard}
                                    onPress={() => handleStartWorkout(part.label, [part.id])}
                                >
                                    <View style={styles.zoneIcon}>
                                        <Ionicons name={part.icon} size={18} color={theme.brandWorkout} />
                                    </View>
                                    <Text style={styles.zoneLabel}>{part.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 3. AI Split Generation */}
                        <Text style={styles.sectionLabel}>AI INTELLIGENCE</Text>
                        <TouchableOpacity
                            style={styles.aiButton}
                            onPress={() => navigation.navigate('BeginnerSetup')}
                        >
                            <View style={[styles.aiGradient, { backgroundColor: theme.brandWorkout }]}>
                                <Ionicons name="flash" size={20} color="#FFF" />
                                <Text style={styles.aiButtonText}>BUILD SMART SPLIT</Text>
                            </View>
                        </TouchableOpacity>

                        {/* 4. Custom Split */}
                        <Text style={styles.sectionLabel}>CUSTOMIZATION</Text>
                        <TouchableOpacity
                            style={styles.customButton}
                            onPress={() => navigation.navigate('CreateCustomSplit')}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={theme.brandWorkout} />
                            <Text style={styles.customButtonText}>CREATE CUSTOM SPLIT</Text>
                        </TouchableOpacity>

                        {userData?.customSplits?.length > 0 && (
                            <View style={styles.customSplitsList}>
                                {userData.customSplits.map((split) => (
                                    <View key={split.id} style={styles.customSplitItem}>
                                        <TouchableOpacity
                                            style={styles.customSplitMain}
                                            onPress={() => handleStartWorkout(split.name, split.zones)}
                                        >
                                            <Text style={styles.customSplitName}>{split.name}</Text>
                                            <Text style={styles.customSplitZones}>{split.zones.join(', ')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteCustomSplit(split.id)}>
                                            <Ionicons name="trash-outline" size={18} color={theme.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <Modal visible={showPlanModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>TRAINING SPLIT OVERVIEW</Text>
                            <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            {plan?.schedule.map((session, idx) => (
                                <View key={idx} style={styles.modalDay}>
                                    <View style={styles.modalDayHeader}>
                                        <View style={styles.modalDayInfo}>
                                            <Text style={styles.modalDayLabel}>DAY {session.day}</Text>
                                            <Text style={styles.modalDayTitle}>{session.title}</Text>
                                            <Text style={styles.modalDayZones}>{session.zones.join(' • ')}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.editDayButton}
                                            onPress={() => {
                                                setShowPlanModal(false);
                                                navigation.navigate('SplitExerciseEditor', { dayIndex: idx });
                                            }}
                                        >
                                            <Ionicons name="create-outline" size={18} color={theme.brandWorkout} />
                                        </TouchableOpacity>
                                    </View>
                                    {session.exercises && session.exercises.length > 0 && (
                                        <View style={styles.exerciseListPreview}>
                                            {session.exercises.slice(0, 4).map((ex, exIdx) => (
                                                <View key={exIdx} style={styles.exercisePreviewItem}>
                                                    <Ionicons name="barbell-outline" size={12} color={theme.textMuted} />
                                                    <Text style={styles.exercisePreviewText}>{ex.name}</Text>
                                                    <Text style={styles.exercisePreviewReps}>{ex.sets}×{ex.reps}</Text>
                                                </View>
                                            ))}
                                            {session.exercises.length > 4 && (
                                                <Text style={styles.moreExercisesText}>
                                                    +{session.exercises.length - 4} more
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                    {(!session.exercises || session.exercises.length === 0) && (
                                        <TouchableOpacity
                                            style={styles.addExercisesPrompt}
                                            onPress={() => {
                                                setShowPlanModal(false);
                                                navigation.navigate('SplitExerciseEditor', { dayIndex: idx });
                                            }}
                                        >
                                            <Ionicons name="add-circle-outline" size={14} color={theme.brandWorkout} />
                                            <Text style={styles.addExercisesText}>Add exercises</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                        <PrimaryButton
                            title="CLOSE"
                            onPress={() => setShowPlanModal(false)}
                            style={{ marginTop: spacing.lg }}
                        />
                    </View>
                </View>
            </Modal>
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
    headerTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, letterSpacing: 2 },
    headerAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40, paddingTop: spacing.md },
    sectionLabel: { fontSize: 12, fontWeight: '500', color: theme.textSecondary, letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.lg },

    // Active View
    todayCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBackground },
    todayContent: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center' },
    todayInfo: { flex: 1 },
    todayTag: { fontSize: 10, fontWeight: '600', color: theme.brandWorkout, letterSpacing: 1, marginBottom: 4 },
    todayTitle: { fontSize: 22, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
    todayZones: { fontSize: 11, fontWeight: '400', color: theme.textSecondary, letterSpacing: 0.5 },
    startButton: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
    startGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },

    splitMenu: { backgroundColor: theme.cardBackground, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
    menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#222222', alignItems: 'center', justifyContent: 'center' },
    menuText: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
    menuSubText: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    menuDivider: { height: 1, backgroundColor: theme.border, marginHorizontal: spacing.lg },

    // Selection View
    zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    zoneCard: { width: '23%', height: 75, backgroundColor: theme.cardBackground, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border, gap: 6 },
    zoneIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#222222', alignItems: 'center', justifyContent: 'center' },
    zoneLabel: { fontSize: 10, fontWeight: '500', color: theme.textPrimary, textTransform: 'uppercase' },

    aiButton: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
    aiGradient: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    aiButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', letterSpacing: 2 },

    customButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: theme.cardBackground,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.brandWorkout,
        gap: 8
    },
    customButtonText: { fontSize: 12, fontWeight: '600', color: theme.brandWorkout, letterSpacing: 1 },

    customSplitsList: { marginTop: spacing.md, gap: spacing.sm },
    customSplitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        gap: 12
    },
    customSplitMain: { flex: 1 },
    customSplitName: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
    customSplitZones: { fontSize: 10, color: theme.textSecondary, marginTop: 2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: spacing.xl },
    modalContent: { backgroundColor: '#151515', borderRadius: 20, padding: spacing.xl, borderWidth: 1, borderColor: theme.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    modalTitle: { fontSize: 14, fontWeight: '600', color: theme.brandWorkout, letterSpacing: 2 },
    modalScroll: { maxHeight: 400 },
    modalDay: { marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
    modalDayHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    modalDayInfo: { flex: 1 },
    modalDayLabel: { fontSize: 10, fontWeight: '500', color: theme.textSecondary, letterSpacing: 1 },
    modalDayTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginTop: 2 },
    modalDayZones: { fontSize: 11, color: theme.brandWorkout, marginTop: 2, fontWeight: '500' },
    editDayButton: { padding: 8, borderRadius: 8, backgroundColor: '#D3540015' },
    exerciseListPreview: { marginTop: spacing.sm, gap: 6 },
    exercisePreviewItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    exercisePreviewText: { flex: 1, fontSize: 12, color: theme.textSecondary, fontWeight: '400' },
    exercisePreviewReps: { fontSize: 11, color: theme.textSecondary, fontWeight: '600' },
    moreExercisesText: { fontSize: 11, color: theme.brandWorkout, fontWeight: '500', marginTop: 4 },
    addExercisesPrompt: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, paddingVertical: 8 },
    addExercisesText: { fontSize: 12, color: theme.brandWorkout, fontWeight: '500' },
});

export default WorkoutSelectionScreen;
