import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Dimensions, Animated, Platform, Modal, Alert } from 'react-native';
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
    const { userData, deleteCustomSplit, deleteTrainingPlan } = useUser();
    const plan = userData?.trainingPlan;

    const [viewMode, setViewMode] = useState(plan ? 'active' : 'selection'); // 'active' or 'selection'
    const [showPlanModal, setShowPlanModal] = useState(false);
    
    // AI Banner Breathing Animation
    const glowAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true
                })
            ])
        ).start();
    }, []);

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

    const handleStartWorkout = (title, zones, exerciseLimit, preloadedExercises = [], customSplitId = null) => {
        navigation.navigate('WorkoutSession', {
            title: title || 'Quick Session',
            zones: zones || [],
            exerciseLimit,
            preloadedExercises,
            customSplitId,
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

    const handleDeletePlan = () => {
        if (Platform.OS === 'web') {
            if (confirm("Are you sure you want to remove your current workout schedule? This will reset your progress tracking for this plan.")) {
                deleteTrainingPlan();
                setViewMode('selection');
            }
        } else {
            Alert.alert(
                "Delete Training Plan",
                "Are you sure you want to remove your current workout schedule? This will reset your progress tracking for this plan.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            await deleteTrainingPlan();
                            setViewMode('selection');
                        }
                    }
                ]
            );
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
                <Text style={styles.headerTitle}>WORKOUT</Text>
                <TouchableOpacity style={styles.headerAction} onPress={() => setViewMode(viewMode === 'active' ? 'selection' : 'active')}>
                    <Ionicons name={viewMode === 'active' ? 'apps-outline' : 'list-outline'} size={24} color={theme.brandWorkout} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {userData.activeWorkoutSession && (
                    <>
                        <Text style={styles.sectionLabel}>RESUME ACTIVE WORKOUT</Text>
                        <TouchableOpacity
                            style={[styles.todayCard, { borderColor: theme.brandWorkout + '50', backgroundColor: theme.brandWorkout + '10', borderWidth: 1 }]}
                            onPress={() => navigation.navigate('WorkoutSession', {
                                resumeSession: true,
                                skipTimeModal: true,
                            })}
                        >
                            <View style={styles.todayContent}>
                                <View style={styles.todayInfo}>
                                    <Text style={[styles.todayTag, { color: theme.brandWorkout }]}>IN PROGRESS</Text>
                                    <Text style={[styles.todayTitle, { color: theme.brandWorkout }]}>{userData.activeWorkoutSession.title}</Text>
                                    <Text style={[styles.todayZones, { color: theme.brandWorkout }]}>
                                        RESUME • {Math.floor(userData.activeWorkoutSession.timer / 60)}m {userData.activeWorkoutSession.timer % 60}s elapsed
                                    </Text>
                                </View>
                                <View style={styles.startButton}>
                                    <View style={[styles.startGradient, { backgroundColor: theme.brandWorkout }]}>
                                        <Ionicons name="play" size={20} color="#FFF" />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </>
                )}

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

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => setViewMode('selection')}
                            >
                                <View style={styles.menuIcon}>
                                    <Ionicons name="add-circle-outline" size={20} color={theme.brandWorkout} />
                                </View>
                                <View style={styles.menuText}>
                                    <Text style={styles.menuTitle}>Create New Split</Text>
                                    <Text style={styles.menuSubText}>Switch to a different program</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                            </TouchableOpacity>

                            <View style={styles.menuDivider} />

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={handleDeletePlan}
                            >
                                <View style={[styles.menuIcon, { backgroundColor: theme.error + '10' }]}>
                                    <Ionicons name="trash-outline" size={20} color={theme.error} />
                                </View>
                                <View style={styles.menuText}>
                                    <Text style={[styles.menuTitle, { color: theme.error }]}>Delete Current Plan</Text>
                                    <Text style={styles.menuSubText}>Remove this schedule from your profile</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* 4. Quick Sessions (Grid) */}
                        <Text style={styles.sectionLabel}>QUICK SESSIONS</Text>
                        <View style={styles.zonesGrid}>
                            {bodyParts.map((part) => (
                                <TouchableOpacity
                                    key={part.id}
                                    style={styles.zoneCardRich}
                                    onPress={() => handleStartWorkout(part.label, [part.id])}
                                >
                                    <View style={styles.zoneIconRich}>
                                        <Ionicons name={part.icon} size={20} color={theme.brandWorkout} />
                                    </View>
                                    <Text style={styles.zoneLabelRich}>{part.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                ) : (
                    <>
                        {/* 1. Quick Sessions (Grid) */}
                        <Text style={styles.sectionLabel}>QUICK SESSIONS</Text>
                        <View style={styles.zonesGrid}>
                            {bodyParts.map((part) => (
                                <TouchableOpacity
                                    key={part.id}
                                    style={styles.zoneCardRich}
                                    onPress={() => handleStartWorkout(part.label, [part.id])}
                                >
                                    <View style={styles.zoneIconRich}>
                                        <Ionicons name={part.icon} size={20} color={theme.brandWorkout} />
                                    </View>
                                    <Text style={styles.zoneLabelRich}>{part.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 2. Custom Split Ribbon */}
                        <Text style={styles.sectionLabel}>CUSTOMIZATION</Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.customRibbonContainer}
                        >
                            <TouchableOpacity
                                style={styles.customAddCard}
                                onPress={() => navigation.navigate('CreateCustomSplit')}
                            >
                                <View style={styles.customAddIconWrapper}>
                                    <Ionicons name="add" size={24} color={theme.brandWorkout} />
                                </View>
                                <Text style={styles.customAddText}>Create Split</Text>
                            </TouchableOpacity>

                            {userData?.customSplits?.map((split) => (
                                <View key={split.id} style={styles.customRibbonItemWrapper}>
                                    <TouchableOpacity
                                        style={styles.customRibbonItem}
                                        onPress={() => handleStartWorkout(split.name, split.zones, undefined, split.exercises, split.id)}
                                    >
                                        <Text style={styles.customRibbonName}>{split.name}</Text>
                                        <Text style={styles.customRibbonZones}>{split.zones.join(', ')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.customRibbonDelete}
                                        onPress={() => deleteCustomSplit(split.id)}
                                    >
                                        <Ionicons name="trash-outline" size={14} color="#FF5252" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        {/* 3. Hero Banner for AI (Small) */}
                        <Animated.View style={[styles.heroRichWrapper, { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]}>
                            <TouchableOpacity
                                style={styles.heroBannerRich}
                                onPress={() => navigation.navigate('BeginnerSetup')}
                            >
                                <View style={styles.heroGradientRich}>
                                    <View style={styles.heroContentRich}>
                                        <View style={styles.heroBadgeRich}>
                                            <Ionicons name="hardware-chip-outline" size={12} color={theme.brandWorkout} />
                                            <Text style={styles.heroBadgeTextRich}>AI ENGINE</Text>
                                        </View>
                                        <Text style={styles.heroTitleRich}>Build a Smart Split</Text>
                                        <Text style={styles.heroSubtitleRich}>Let AI craft the perfect workout plan tailored specifically for you.</Text>
                                    </View>
                                    <View style={styles.heroIconContainerRich}>
                                        <Ionicons name="flash" size={16} color={theme.brandWorkout} style={styles.heroIconRich} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
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

    // Rich 2-Column Vertical Grid
    zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
    zoneCardRich: { width: '48%', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
    zoneIconRich: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.brandWorkout + '20', alignItems: 'center', justifyContent: 'center' },
    zoneLabelRich: { fontSize: 13, fontWeight: '600', color: '#FFF', flex: 1 },

    // Classy Small AI Hero Banner
    heroRichWrapper: { borderRadius: 18, padding: 1, backgroundColor: 'rgba(82, 183, 136, 0.3)', marginTop: spacing.md, marginBottom: spacing.xl },
    heroBannerRich: { borderRadius: 17, overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
    heroGradientRich: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
    heroContentRich: { flex: 1 },
    heroBadgeRich: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(82, 183, 136, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 6, gap: 4, borderWidth: 1, borderColor: 'rgba(82, 183, 136, 0.2)' },
    heroBadgeTextRich: { color: theme.brandWorkout, fontSize: 9, fontWeight: '800', letterSpacing: 2 },
    heroTitleRich: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
    heroSubtitleRich: { fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 16, paddingRight: 10 },
    heroIconContainerRich: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(82, 183, 136, 0.15)', alignItems: 'center', justifyContent: 'center' },
    heroIconRich: { opacity: 1 },

    // Custom Ribbon
    customRibbonContainer: { paddingRight: spacing.lg, gap: spacing.md, paddingBottom: spacing.sm },
    customAddCard: { width: 130, height: 110, backgroundColor: 'transparent', borderRadius: 16, padding: spacing.md, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.brandWorkout, borderStyle: 'dashed' },
    customAddIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(45, 106, 79, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    customAddText: { fontSize: 12, fontWeight: '700', color: theme.brandWorkout, textTransform: 'uppercase', letterSpacing: 0.5 },
    
    customRibbonItemWrapper: { position: 'relative' },
    customRibbonItem: { width: 140, height: 110, backgroundColor: theme.cardBackground, borderRadius: 16, padding: spacing.md, justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    customRibbonName: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
    customRibbonZones: { fontSize: 11, color: theme.textSecondary, lineHeight: 16 },
    customRibbonDelete: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255, 82, 82, 0.15)', alignItems: 'center', justifyContent: 'center' },

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
