import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Dimensions, Animated, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import ExplanationModal from '../components/ExplanationModal';
import FloatingCard from '../components/FloatingCard';

const { width } = Dimensions.get('window');

// Daily motivational quotes (Rotating daily)
const QUOTES = [
    "Discipline builds what motivation cannot.",
    "Train even when no one is watching.",
    "Strength is earned in silence.",
    "Consistency turns effort into results.",
    "Show up. Execute. Repeat.",
    "Progress favors the disciplined.",
    "No shortcuts. Just standards.",
    "The work you avoid today becomes tomorrow’s weakness.",
    "Focus is a form of strength.",
    "Results follow routine.",
];

const DashboardScreen = ({ navigation }) => {
    const { userData, addWater, removeWater, checkAndResetDaily } = useUser();
    const { theme } = useTheme();

    // Entrance animation for tactical modules
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(10)).current;

    // Background Orbs
    const orb1Anim = useRef(new Animated.Value(0)).current;
    const orb2Anim = useRef(new Animated.Value(0)).current;

    // Scroll position for bottom button
    const [showBottomButton, setShowBottomButton] = React.useState(false);

    useEffect(() => {
        checkAndResetDaily();

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();

        const createLoop = (anim, duration) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
                ])
            ).start();
        };

        createLoop(orb1Anim, 12000);
        createLoop(orb2Anim, 18000);
    }, []);

    const formatName = (name) => {
        if (!name) return 'User';
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const userName = formatName(userData.name);

    // Get daily quote based on date
    const getDailyQuote = () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = today - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return QUOTES[dayOfYear % QUOTES.length];
    };
    const dailyQuote = getDailyQuote();
    const caloriesConsumed = userData.dailyCalories || 0;
    const caloriesGoal = userData.calorieGoal || 2000;
    const caloriesBurned = userData.caloriesBurned || 0;

    // Determine the burn goal (daily deficit). If positive, it's a deficit goal. If negative/zero, it's a surplus/maintenance (so burn goal is practically just their baseline activity which we can show as 0 or absolute value).
    const rawDeficit = userData.dailyDeficit || 0;
    const burnGoal = rawDeficit > 0 ? rawDeficit : 0;

    const remaining = Math.max(0, caloriesGoal - caloriesConsumed);
    const isOverLimit = caloriesConsumed > caloriesGoal;

    const [showWhyModal, setShowWhyModal] = React.useState(false);

    const goalType = userData.primaryGoal === 'muscle_gain' ? 'Surplus' : userData.primaryGoal === 'weight_loss' ? 'Deficit' : 'Maintenance';
    const goalText = userData.primaryGoal === 'muscle_gain' ? 'Building Muscle' : userData.primaryGoal === 'weight_loss' ? 'Burning Fat' : 'Staying Healthy';

    const whyContent = [
        `STATUS: ${isOverLimit ? 'OVER LIMIT' : 'ON TRACK'}`,
        `Your Goal: ${caloriesGoal} kcal represents a safe ${goalType} for ${goalText}.`,
        `Calculation: BMR + Activity Level factored in.`,
        `Strategy: Consistency is the key to progress.`,
        `Trend: Data within expected variance.`
    ];

    const explainPlan = () => {
        setShowWhyModal(true);
    };

    const handleAskAI = () => {
        navigation.navigate('AIChat', {
            initialMessage: `Review my progress: ${caloriesConsumed}/${caloriesGoal} kcal. Give me a brief, helpful update.`
        });
    };

    const waterGlasses = userData.waterIntake || 0;
    const waterGoalMl = userData.waterGoal || 2000;
    const maxGlasses = Math.ceil(waterGoalMl / 250);
    const waterMl = waterGlasses * 250;
    const waterPercent = Math.min(100, (waterGlasses / maxGlasses) * 100);

    const workouts = userData.totalWorkouts || 0;
    const streak = userData.currentStreak || 0;
    const exerciseMinutes = userData.todayExerciseMinutes || 0;
    const weight = userData.currentWeight || 70;

    // CTA Hierarchy Context
    const getTimeContext = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return 'intake';
        if (hour >= 11 && hour < 20) return 'workout';
        return 'ai';
    };
    const ctaContext = getTimeContext();

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Enhanced Core Background with Mesh Gradient Effect */}
            <View style={styles.backgroundContainer}>
                {/* Base Dark Gradient */}
                <LinearGradient
                    colors={[theme.background, '#1A1A1A', theme.background]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                {/* Ambient Grid Overlay (Sleek/Glassy) - Replacing Tactical Grid */}
                <View style={[styles.gridOverlay, { opacity: theme.isDark ? 0.02 : 0.01 }]}>
                    {/* Clean solid color background handles the majority of the weight in modern designs */}
                </View>

                {/* Orb 1 - Primary Glow (Subtle Ambient) */}
                <Animated.View
                    style={[
                        styles.backgroundOrb,
                        {
                            top: '-5%',
                            right: '-10%',
                            width: 400,
                            height: 400,
                            backgroundColor: theme.primary,
                            opacity: orb1Anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.03, 0.08] // Much softer glow
                            }),
                            transform: [{ scale: orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }]
                        }
                    ]}
                />

                {/* Orb 2 - Middle Accent */}
                <Animated.View
                    style={[
                        styles.backgroundOrb,
                        {
                            top: '40%',
                            left: '-20%',
                            width: 300,
                            height: 300,
                            backgroundColor: theme.primary,
                            opacity: orb2Anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.05, 0.12]
                            }),
                            transform: [{ scale: orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }]
                        }
                    ]}
                />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                onScroll={(event) => {
                    const offsetY = event.nativeEvent.contentOffset.y;
                    setShowBottomButton(offsetY > 100);
                }}
                scrollEventThrottle={16}
            >
                {/* Tactical Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.dailyQuote}>{dailyQuote}</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                        <View style={styles.profileGradient}>
                            <Ionicons name="person" size={20} color={theme.brandProfile} />
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Calorie Status Hero */}
                <Animated.View style={[styles.calorieCardOuter, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={[styles.calorieCard, isOverLimit && { borderColor: theme.error + '40' }]}>

                        <View style={styles.calorieRing}>
                            <View style={styles.ringBg} />
                            {/* Progress fill using rotation-based segments */}
                            {(() => {
                                const progress = Math.min(1, caloriesConsumed / caloriesGoal);
                                const degrees = progress * 360;
                                const progressColor = isOverLimit ? theme.error : theme.primary;

                                return (
                                    <>
                                        {/* First half (0-180 degrees) */}
                                        {degrees > 0 && (
                                            <View style={[styles.ringProgress, {
                                                transform: [{ rotate: `${Math.min(degrees, 180)}deg` }],
                                                borderTopColor: progressColor,
                                                borderRightColor: degrees >= 90 ? progressColor : 'transparent',
                                            }]} />
                                        )}
                                        {/* Second half (180-360 degrees) */}
                                        {degrees > 180 && (
                                            <View style={[styles.ringProgress, {
                                                transform: [{ rotate: `${degrees}deg` }],
                                                borderTopColor: progressColor,
                                                borderRightColor: degrees >= 270 ? progressColor : 'transparent',
                                            }]} />
                                        )}
                                        {/* Overlay to create arc effect */}
                                        <View style={[styles.ringOverlay, {
                                            backgroundColor: '#1C1C1C',
                                        }]} />
                                    </>
                                );
                            })()}
                            <View style={styles.ringCenter}>
                                <Text style={styles.calValue}>{caloriesConsumed}</Text>
                                <Text style={styles.calUnit}>/ {caloriesGoal} KCAL</Text>
                            </View>
                        </View>

                        <View style={styles.calStats}>
                            <View style={styles.calStat}>
                                <Text style={styles.calStatLbl}>EXPENDED</Text>
                                <Text style={styles.calStatVal}>
                                    {Math.round(caloriesBurned) > 0 ? Math.round(caloriesBurned) : '0'}
                                    <Text style={styles.calStatSub}> / {burnGoal > 0 ? burnGoal : '0'} KCAL</Text>
                                </Text>
                            </View>

                            <View style={styles.calDivider} />

                            <View style={styles.calStat}>
                                <TouchableOpacity style={styles.whyBtn} onPress={explainPlan}>
                                    <Ionicons name="help-circle-outline" size={12} color={theme.primary} />
                                    <Text style={styles.whyTxt}>SYSTEM STATUS</Text>
                                </TouchableOpacity>
                                <Text style={styles.calStatLbl}>RESERVE</Text>
                                <Text style={[styles.calStatVal, { color: isOverLimit ? theme.error : '#F5F5F5' }]}>{remaining}</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Command Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('AddMeal')}
                    >
                        <View style={styles.actionInner}>
                            <Ionicons name="add-circle-outline" size={24} color={theme.brandNutrition} />
                            <Text style={styles.actionTxt}>LOG FOOD</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('WorkoutSelection')}
                    >
                        <View style={[styles.actionInner, { backgroundColor: theme.brandWorkout }]}>
                            <Ionicons
                                name="barbell-outline"
                                size={24}
                                color="#fff"
                            />
                            <Text style={[styles.actionTxt, { color: '#fff' }]}>TRAINING</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Training Plan Section - Today's Battle or Resume Workout */}
                {userData.activeWorkoutSession ? (
                    <View style={styles.planSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.section}>RESUME YOUR WORKOUT</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.todayCard, { borderColor: theme.brandWorkout + '50', backgroundColor: theme.brandWorkout + '10' }]}
                            onPress={() => navigation.navigate('WorkoutSession', {
                                resumeSession: true,
                                skipTimeModal: true,
                            })}
                        >
                            <View style={styles.todayContent}>
                                <View style={styles.todayInfo}>
                                    <View style={[styles.planBadge, { backgroundColor: theme.brandWorkout }]}>
                                        <Text style={styles.planBadgeTxt}>IN PROGRESS</Text>
                                    </View>
                                    <Text style={[styles.todayTitle, { color: theme.brandWorkout }]}>{userData.activeWorkoutSession.title}</Text>
                                    <Text style={[styles.todayZones, { color: theme.brandWorkout }]}>
                                        RESUME • {Math.floor(userData.activeWorkoutSession.timer / 60)}m {userData.activeWorkoutSession.timer % 60}s elapsed
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                ) : userData.trainingPlan ? (
                    <View style={styles.planSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.section}>TODAY'S BATTLE</Text>
                        </View>

                        {(() => {
                            const today = new Date().getDay(); // 0 is Sunday, 1 is Monday...
                            // Map day to schedule index (assumes schedule is 7 days or loops)
                            const sessionIdx = (today === 0 ? 6 : today - 1) % userData.trainingPlan.schedule.length;
                            const todaySession = userData.trainingPlan.schedule[sessionIdx];

                            if (!todaySession) return null;

                            return (
                                <TouchableOpacity
                                    style={styles.todayCard}
                                    onPress={() => navigation.navigate('WorkoutSession', {
                                        title: todaySession.title,
                                        zones: todaySession.zones,
                                        exerciseLimit: todaySession.exerciseLimit,
                                        preloadedExercises: todaySession.exercises || [],
                                        skipTimeModal: true,
                                    })}
                                >
                                    <View style={styles.todayContent}>
                                        <View style={styles.todayInfo}>
                                            <View style={styles.planBadge}>
                                                <Text style={styles.planBadgeTxt}>{(userData.trainingPlan.splitType || 'PLAN').toUpperCase()}</Text>
                                            </View>
                                            <Text style={styles.todayTitle}>{todaySession.title}</Text>
                                            <Text style={styles.todayZones}>{todaySession.zones?.join(' • ')}</Text>
                                        </View>
                                        <View style={styles.todayAction}>
                                            <View style={styles.startBtn}>
                                                <Ionicons name="play" size={18} color="#fff" />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })()}
                    </View>
                ) : null}

                {/* Macros Overview */}
                <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.section}>MACROS</Text>
                        <TouchableOpacity onPress={explainPlan} style={styles.infoIcon}>
                            <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.macrosGrid}>
                        {/* Row 1 */}
                        <View style={styles.macrosRow}>
                            {[
                                { name: 'PROTEIN', consumed: Math.round(userData.proteinConsumed || 0), goal: Math.round(userData.proteinGoal || 0), color: theme.protein, unit: 'G' },
                                { name: 'CARBS', consumed: Math.round(userData.carbsConsumed || 0), goal: Math.round(userData.carbsGoal || 0), color: theme.carbs, unit: 'G' },
                            ].map((m, i) => (
                                <View key={i} style={styles.macroCard}>
                                    <Text style={styles.macroName}>{m.name}</Text>
                                    <Text style={[
                                        styles.macroVal,
                                        { color: m.color }
                                    ]}>
                                        {m.consumed}<Text style={[styles.macroGoal, { color: m.color }]}>/{m.goal}</Text><Text style={[styles.macroUnit, { color: m.color }]}>{m.unit}</Text>
                                    </Text>
                                    <View style={[
                                        styles.macroIndicator,
                                        { backgroundColor: m.color },
                                        m.consumed > 0 ? { opacity: 1 } : { opacity: 0.2 }
                                    ]} />
                                </View>
                            ))}
                        </View>
                        {/* Row 2 */}
                        <View style={styles.macrosRow}>
                            {[
                                { name: 'FATS', consumed: Math.round(userData.fatsConsumed || 0), goal: Math.round(userData.fatsGoal || 0), color: theme.fats, unit: 'G' },
                                { name: 'FIBER', consumed: Math.round(userData.fiberConsumed || 0), goal: Math.round(userData.fiberGoal || 25), color: theme.fiber, unit: 'G' },
                            ].map((m, i) => (
                                <View key={i} style={styles.macroCard}>
                                    <Text style={styles.macroName}>{m.name}</Text>
                                    <Text style={[
                                        styles.macroVal,
                                        { color: m.color }
                                    ]}>
                                        {m.consumed}<Text style={[styles.macroGoal, { color: m.color }]}>/{m.goal}</Text><Text style={[styles.macroUnit, { color: m.color }]}>{m.unit}</Text>
                                    </Text>
                                    <View style={[
                                        styles.macroIndicator,
                                        { backgroundColor: m.color },
                                        m.consumed > 0 ? { opacity: 1 } : { opacity: 0.2 }
                                    ]} />
                                </View>
                            ))}
                        </View>
                    </View>
                </Animated.View>

                {/* Tactical Hydration */}
                <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.section}>HYDRATION</Text>
                        <TouchableOpacity onPress={explainPlan} style={styles.infoIcon}>
                            <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.hydrationCard}>
                        <View style={styles.hydrationLeft}>
                            <View style={styles.waterMonitor}>
                                <View style={[styles.waterFill, { height: `${waterPercent}%`, backgroundColor: theme.water }]} />
                                <View style={styles.monitorGrid} />
                            </View>
                        </View>

                        <View style={styles.hydrationInfo}>
                            {waterMl > 0 ? (
                                <>
                                    <View style={styles.hydrationHeader}>
                                        <Text style={styles.hydrationVal}>{waterMl}</Text>
                                        <Text style={styles.hydrationUnit}>ML / {waterGoalMl}</Text>
                                    </View>
                                    <Text style={styles.hydrationSub}>{waterGlasses} GLASSES LOGGED</Text>
                                </>
                            ) : (
                                <View style={styles.hydrationPlaceholderBox}>
                                    <Text style={styles.hydrationPlaceholder}>NO WATER LOGGED YET</Text>
                                    <Text style={styles.hydrationHint}>Track your daily hydration</Text>
                                </View>
                            )}

                            <View style={styles.hydrationBtns}>
                                <TouchableOpacity style={styles.hBtn} onPress={() => removeWater(1)}>
                                    <Ionicons name="remove" size={20} color={theme.textPrimary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.hBtn, styles.hBtnAdd, { backgroundColor: theme.brandNutrition }]}
                                    onPress={() => addWater(1)}
                                >
                                    <Ionicons name="add" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* CoreCoach AI Button */}
                <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <TouchableOpacity
                        style={styles.coreCoachButton}
                        onPress={() => navigation.navigate('AIChat')}
                    >
                        <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
                        <Text style={styles.coreCoachText}>CORECOACH</Text>
                    </TouchableOpacity>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView >


            <ExplanationModal
                visible={showWhyModal}
                onClose={() => setShowWhyModal(false)}
                title="Your Daily Summary 📊"
                content={whyContent}
                onAskAI={handleAskAI}
            />
        </SafeAreaView >
    );
};

const CARD_GAP = spacing.sm;
const PROGRESS_SIZE = (width - spacing.lg * 2 - CARD_GAP) / 2;

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: theme.isDark ? 0.03 : 0.02,
    },
    backgroundOrb: {
        position: 'absolute',
        borderRadius: 1000,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 100,
        elevation: 0,
    },
    scroll: { padding: spacing.lg, paddingBottom: 100 },
    orb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: theme.isDark ? 0.5 : 0.05,
    },
    header: { flexDirection: 'row', marginBottom: spacing.xl, alignItems: 'center', marginTop: 10 },
    headerLeft: { flex: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.5, shadowRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '900', color: theme.isDark ? '#B0B0B0' : theme.textMuted, letterSpacing: 1 },
    userName: { fontSize: 26, fontWeight: '600', color: '#F5F5F5', letterSpacing: -0.5, marginBottom: 4 },
    dailyQuote: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.primary,
        fontStyle: 'italic',
        opacity: 0.9,
        textShadowColor: theme.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10
    },
    profileBtn: { width: 44, height: 44, borderRadius: 12, padding: 1.5 },
    profileGradient: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C1C1C', borderWidth: 1, borderColor: '#2A2A2A' },

    calorieCardOuter: { marginBottom: spacing.xl },
    calorieCard: {
        borderRadius: 16,
        padding: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1C',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        overflow: 'hidden'
    },
    calorieRing: { width: 120, height: 120, marginRight: spacing.xl, alignItems: 'center', justifyContent: 'center' },
    ringBg: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: '#2A2A2A' },
    ringProgress: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        borderColor: 'transparent',
    },
    ringOverlay: {
        position: 'absolute',
        width: 104,
        height: 104,
        borderRadius: 52,
    },
    ringCenter: { alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    calValue: { fontSize: 28, fontWeight: '600', color: '#F5F5F5', letterSpacing: -1 },
    calUnit: { fontSize: 10, color: '#A1A1A1', fontWeight: '500', letterSpacing: 1 },

    calStats: { flex: 1, gap: spacing.md },
    calStat: { gap: 4 },
    calStatVal: { fontSize: 24, fontWeight: '600', color: '#F5F5F5' },
    calStatSub: { fontSize: 12, fontWeight: '500', color: '#A1A1A1' },
    calStatLbl: { fontSize: 11, color: '#A1A1A1', fontWeight: '500', letterSpacing: 1.5 },
    calDivider: { height: 1, backgroundColor: '#2A2A2A' },

    whyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    whyTxt: { fontSize: 10, fontWeight: '600', color: theme.primary, letterSpacing: 0.5 },

    actions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    actionBtn: { flex: 1, borderRadius: 14, overflow: 'hidden', height: 60 },
    actionInner: { flex: 1, borderRadius: 14, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: '#2A2A2A', backgroundColor: '#1C1C1C', justifyContent: 'center' },
    actionTxt: { fontSize: 12, fontWeight: '600', color: '#F5F5F5', letterSpacing: 1 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    section: { fontSize: 12, fontWeight: '500', color: '#A1A1A1', letterSpacing: 1, textTransform: 'uppercase' },
    infoIcon: { padding: 4, marginRight: -4 },

    macrosGrid: { marginBottom: spacing.xl, gap: spacing.sm },
    macrosRow: { flexDirection: 'row', gap: spacing.sm },
    macroCard: {
        flex: 1,
        borderRadius: 12,
        padding: spacing.md,
        backgroundColor: '#1C1C1C',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        alignItems: 'center'
    },
    macroName: { fontSize: 10, fontWeight: '500', color: '#A1A1A1', marginBottom: 2, letterSpacing: 1 },
    macroVal: { fontSize: 36, fontWeight: '700' },
    macroGoal: { fontSize: 12, opacity: 0.6, fontWeight: '400' },
    macroUnit: { fontSize: 10, opacity: 0.7, fontWeight: '500' },
    macroIndicator: { width: 12, height: 2, borderRadius: 1, marginTop: 6 },

    hydrationCard: {
        flexDirection: 'row',
        padding: spacing.lg,
        backgroundColor: '#1C1C1C',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        alignItems: 'center'
    },
    hydrationLeft: { marginRight: spacing.xl },
    waterMonitor: { width: 30, height: 100, backgroundColor: '#2A2A2A', borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
    waterFill: { width: '100%', borderRadius: 2 },
    monitorGrid: { ...StyleSheet.absoluteFillObject, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', height: 20 },

    hydrationInfo: { flex: 1 },
    hydrationPlaceholderBox: { height: 60, justifyContent: 'center' },
    hydrationPlaceholder: { fontSize: 14, fontWeight: '600', color: '#A1A1A1' },
    hydrationHint: { fontSize: 10, color: theme.brandNutrition, fontWeight: '500', textTransform: 'uppercase', marginTop: 4 },
    hydrationHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 2 },
    hydrationVal: { fontSize: 32, fontWeight: '600', color: '#F5F5F5' },
    hydrationUnit: { fontSize: 12, color: '#A1A1A1', fontWeight: '400' },
    hydrationSub: { fontSize: 10, fontWeight: '600', color: theme.brandNutrition, letterSpacing: 1, marginBottom: spacing.md },
    hydrationBtns: { flexDirection: 'row', gap: spacing.md },
    hBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#222222', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
    hBtnAdd: { backgroundColor: theme.brandNutrition },

    progressGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
    progressCard: { flex: 1, borderRadius: borderRadius.sm, paddingVertical: spacing.lg, alignItems: 'center', backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
    progressVal: { fontSize: 24, fontWeight: '900', color: theme.textPrimary },
    progressLbl: { fontSize: 10, color: theme.isDark ? '#A0A0A0' : theme.textSecondary, marginTop: 4, fontWeight: '900', letterSpacing: 1 },
    nodeIndicator: { width: 12, height: 2, backgroundColor: theme.primary, marginTop: 8 },

    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 100,
    },
    todayCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2A2A' },
    todayContent: { flexDirection: 'row', padding: spacing.lg, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1C1C1C' },
    todayZones: { fontSize: 12, color: '#A1A1A1', fontWeight: '400', marginTop: 4 },
    todayInfo: { flex: 1, gap: 4 },
    todayTitle: { fontSize: 18, fontWeight: '600', color: '#F5F5F5' },
    todayAction: { marginLeft: spacing.md },
    startBtn: { backgroundColor: theme.brandWorkout, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

    planBadge: { backgroundColor: theme.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    planBadgeTxt: { fontSize: 9, fontWeight: '600', color: '#F5F5F5', letterSpacing: 1 },

    // CoreCoach Button Styles
    coreCoachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.brandAI,
        paddingVertical: 16,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        marginTop: 50,
        marginBottom: spacing.md,
        gap: spacing.sm,
        shadowColor: theme.brandAI,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    },
    coreCoachText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },

    // Bottom Button Styles
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.lg,
        paddingBottom: 0,
        paddingTop: spacing.md,
        backgroundColor: 'transparent',
    },
    bottomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary,
        paddingVertical: 16,
        paddingHorizontal: spacing.xl,
        borderRadius: 14,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 12,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: theme.primary + '50',
    },
    bottomButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1.5,
    },
});

export default DashboardScreen;
