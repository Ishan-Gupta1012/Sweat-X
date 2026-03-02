import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, Easing, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import PrimaryButton from '../components/PrimaryButton';

const SetupLoadingScreen = ({ navigation }) => {
    const { theme, isDarkMode } = useTheme();
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [isReady, setIsReady] = useState(false);

    const pulseValue = useRef(new Animated.Value(1)).current;
    const rotateValue = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const styles = useMemo(() => createStyles(theme), [theme]);

    const steps = [
        { text: 'Analyzing goals', icon: 'analytics' },
        { text: 'Calculating calories', icon: 'calculator' },
        { text: 'Building workouts', icon: 'barbell' },
        { text: 'Finalizing plan', icon: 'checkmark-done' },
    ];

    useEffect(() => {
        // Shared animations
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, { toValue: 1.1, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseValue, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();

        const rotationAnim = Animated.loop(
            Animated.timing(rotateValue, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
        );
        rotationAnim.start();

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsReady(true);
                    return 100;
                }
                const newProgress = Math.min(100, prev + 2.5);
                setCurrentStep(Math.min(3, Math.floor(newProgress / 25)));
                return newProgress;
            });
        }, 100);

        return () => {
            clearInterval(interval);
            pulse.stop();
            rotationAnim.stop();
        };
    }, []);

    useEffect(() => {
        if (isReady) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        }
    }, [isReady]);

    const rotation = rotateValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    if (isReady) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <View style={styles.readyIconContainer}>
                        <View style={[styles.readyCircle, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="checkmark-done-circle" size={80} color={theme.primary} />
                        </View>
                    </View>

                    <Text style={styles.readyTitle}>Your plan is ready</Text>
                    <Text style={styles.readySubtitle}>Built to fit your body and your pace</Text>

                    <View style={styles.readyContent}>
                        <View style={styles.readyTip}>
                            <Ionicons name="sparkles" size={20} color={theme.primary} />
                            <Text style={styles.readyTipText}>Daily calorie goal set</Text>
                        </View>
                        <View style={styles.readyTip}>
                            <Ionicons name="fitness" size={20} color={theme.primary} />
                            <Text style={styles.readyTipText}>Custom workout routine built</Text>
                        </View>
                    </View>

                    <PrimaryButton
                        title="Go to Dashboard"
                        onPress={() => navigation.replace('MainApp')}
                        style={styles.readyBtn}
                    />
                </Animated.View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            <View style={styles.content}>
                {/* Animated Loader */}
                <View style={styles.loaderContainer}>
                    <Animated.View style={[styles.spinRing, { transform: [{ rotate: rotation }], borderTopColor: theme.primary, borderRightColor: theme.primary + '50' }]} />
                    <Animated.View style={[styles.centerCircle, { transform: [{ scale: pulseValue }], backgroundColor: theme.primary }]}>
                        <Ionicons name={steps[currentStep].icon} size={40} color="#fff" />
                    </Animated.View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Setting Up</Text>
                <Text style={[styles.titleAccent, { color: theme.primary }]}>Your Plan</Text>

                {/* Current Step */}
                <View style={[styles.stepBadge, { backgroundColor: theme.cardBackground }]}>
                    <Ionicons name={steps[currentStep].icon} size={16} color={theme.primary} />
                    <Text style={styles.stepText}>{steps[currentStep].text}...</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: theme.cardBackground }]}>
                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
                    </View>
                    <Text style={[styles.progressPercent, { color: theme.primary }]}>{Math.round(progress)}%</Text>
                </View>

                {/* Step Indicators */}
                <View style={styles.stepsRow}>
                    {steps.map((step, index) => (
                        <View key={index} style={styles.stepItem}>
                            <View style={[
                                styles.stepDot,
                                { backgroundColor: theme.cardBackground },
                                index < currentStep && { backgroundColor: theme.success },
                                index === currentStep && { backgroundColor: theme.primary }
                            ]}>
                                {index < currentStep && <Ionicons name="checkmark" size={12} color="#fff" />}
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            <Text style={styles.footer}>Sweat-X</Text>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    loaderContainer: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
    spinRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: 'transparent' },
    centerCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '700', color: theme.textPrimary },
    titleAccent: { fontSize: 32, fontWeight: '800', marginBottom: spacing.lg },
    stepBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.xl, marginBottom: spacing.xl },
    stepText: { color: theme.textPrimary, fontSize: 14 },
    progressContainer: { width: '80%', flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressPercent: { fontSize: 14, fontWeight: '700', width: 40 },
    stepsRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xl },
    stepItem: { alignItems: 'center' },
    stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    footer: { textAlign: 'center', color: theme.textMuted, fontSize: 12, letterSpacing: 3, paddingBottom: spacing.xxl },

    // Ready State Styles
    readyIconContainer: { marginBottom: spacing.xl },
    readyCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
    readyTitle: { fontSize: 28, fontWeight: '700', color: theme.textPrimary, marginBottom: spacing.xs },
    readySubtitle: { fontSize: 16, color: theme.textMuted, marginBottom: spacing.xl, textAlign: 'center' },
    readyContent: { width: '100%', marginBottom: spacing.xxl },
    readyTip: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: theme.cardBackground, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
    readyTipText: { fontSize: 15, color: theme.textPrimary, fontWeight: '600' },
    readyBtn: { width: '100%' },
});

export default SetupLoadingScreen;
