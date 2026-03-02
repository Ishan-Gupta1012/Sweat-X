import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Animated, PanResponder, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const OnboardingStep2 = ({ navigation }) => {
    const { userData, updateProfile, completeOnboarding } = useUser();
    const { theme, isDarkMode } = useTheme();

    // Moved from Step 1
    const [height, setHeight] = useState(userData.height || '170');
    const [gender, setGender] = useState(userData.gender || 'male');
    const [activityLevel, setActivityLevel] = useState(userData.activityLevel || 'moderate');

    // Existing Step 2 fields
    const [currentWeight, setCurrentWeight] = useState(userData.currentWeight || 75);
    const [targetWeight, setTargetWeight] = useState(userData.targetWeight || 68);
    const [goalDuration, setGoalDuration] = useState(userData.goalDuration || 12); // weeks
    const [medicalConditions, setMedicalConditions] = useState(userData.medicalConditions || '');

    const genderOptions = [
        { id: 'male', label: 'Male', icon: 'male' },
        { id: 'female', label: 'Female', icon: 'female' },
        { id: 'other', label: 'Other', icon: 'person' },
    ];

    const activityOptions = [
        { id: 'sedentary', label: 'Sedentary', emoji: '🪑' },
        { id: 'light', label: 'Light', emoji: '🚶' },
        { id: 'moderate', label: 'Moderate', emoji: '🏃' },
        { id: 'active', label: 'Active', emoji: '🔥' },
    ];

    const handleNext = async (isSkipped = false) => {
        await updateProfile({
            height,
            gender,
            activityLevel,
            currentWeight,
            targetWeight,
            goalDuration,
            medicalConditions,
        });
        await completeOnboarding();
        navigation.navigate('SetupLoading');
    };

    const calculateBMI = () => {
        const heightVal = parseFloat(height) || 170;
        const heightM = heightVal / 100;
        const bmi = targetWeight / (heightM * heightM);
        return bmi.toFixed(1);
    };

    const getBMICategory = () => {
        const bmi = parseFloat(calculateBMI());
        if (bmi < 18.5) return { label: 'Underweight', color: '#FF9500' };
        if (bmi < 25) return { label: 'Healthy', color: '#34C759' };
        if (bmi < 30) return { label: 'Overweight', color: '#FF9500' };
        return { label: 'Obese', color: '#FF3B30' };
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    const WeightSlider = ({ label, value, setValue, min, max, icon, color }) => {
        const sliderWidth = useRef(200);
        const animValue = useRef(new Animated.Value(0)).current;

        const handleSliderTouch = (locationX) => {
            if (sliderWidth.current > 0) {
                const newPercentage = Math.max(0, Math.min(100, (locationX / sliderWidth.current) * 100));
                const newValue = Math.round(min + (newPercentage / 100) * (max - min));
                setValue(newValue);
                Animated.spring(animValue, { toValue: 1, useNativeDriver: true, friction: 5 }).start(() => {
                    animValue.setValue(0);
                });
            }
        };

        const panResponder = useRef(
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: (evt) => handleSliderTouch(evt.nativeEvent.locationX),
                onPanResponderMove: (evt) => handleSliderTouch(evt.nativeEvent.locationX),
            })
        ).current;

        const percentage = ((value - min) / (max - min)) * 100;

        return (
            <View style={styles.weightCard}>
                <View style={styles.weightHeader}>
                    <View style={[styles.weightIconBg, { backgroundColor: color + '20' }]}>
                        <Text style={styles.weightEmoji}>{icon}</Text>
                    </View>
                    <View style={styles.weightInfo}>
                        <Text style={styles.weightLabel}>{label}</Text>
                        <View style={styles.weightValueRow}>
                            <Text style={[styles.weightValue, { color }]}>{value}</Text>
                            <Text style={styles.weightUnit}>kg</Text>
                        </View>
                    </View>
                </View>

                <View
                    style={styles.sliderTrackWrapper}
                    onLayout={(e) => { sliderWidth.current = e.nativeEvent.layout.width; }}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.sliderTrack}>
                        <Animated.View
                            style={[
                                styles.sliderFill,
                                { width: `${percentage}%`, backgroundColor: color }
                            ]}
                        />
                        <View style={[styles.sliderThumb, { left: `${percentage}%`, backgroundColor: color }]}>
                            <View style={styles.thumbInner} />
                        </View>
                    </View>
                </View>

                <View style={styles.quickRow}>
                    {[-5, -1, 1, 5].map((delta) => (
                        <TouchableOpacity
                            key={delta}
                            style={[styles.quickBtn, delta > 0 && { borderColor: color }]}
                            onPress={() => setValue(Math.max(min, Math.min(max, value + delta)))}
                        >
                            <Text style={[styles.quickText, { color: delta > 0 ? color : theme.textMuted }]}>
                                {delta > 0 ? `+${delta}` : delta}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const weightDiff = Math.abs(currentWeight - targetWeight);
    const weeklyChange = goalDuration > 0 ? (weightDiff / goalDuration).toFixed(2) : 0;
    const isHealthyPace = weeklyChange <= 1;
    const bmiInfo = getBMICategory();

    const durationOptions = [
        { label: '4w', value: 4 },
        { label: '8w', value: 8 },
        { label: '12w', value: 12 },
        { label: '16w', value: 16 },
        { label: '24w', value: 24 },
        { label: '52w', value: 52 },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    <View style={styles.stepDotDone} />
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                    <View style={styles.stepDot} />
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.titleSection}>
                    <Text style={styles.emoji}>📊</Text>
                    <Text style={styles.title}>Refining Your Plan</Text>
                    <Text style={styles.subtitle}>Optional details for better accuracy</Text>
                </View>

                {/* Profile Details Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardInfoTitle}>Personal Details</Text>

                    {/* Height Input */}
                    <View style={styles.inputRow}>
                        <View style={styles.inputLabelContainer}>
                            <Ionicons name="resize" size={18} color={theme.primary} />
                            <Text style={styles.inputLabel}>Height (cm)</Text>
                        </View>
                        <TextInput
                            style={styles.textInput}
                            value={height}
                            onChangeText={setHeight}
                            keyboardType="numeric"
                            maxLength={3}
                            placeholder="170"
                        />
                    </View>

                    {/* Gender Selection */}
                    <View style={styles.inputCol}>
                        <Text style={styles.inputLabel}>Gender</Text>
                        <View style={styles.optionRow}>
                            {genderOptions.map((opt) => (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.optionBtn, gender === opt.id && styles.optionBtnActive]}
                                    onPress={() => setGender(opt.id)}
                                >
                                    <Text style={[styles.optionBtnText, gender === opt.id && styles.optionBtnTextActive]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Activity Level Selection */}
                    <View style={styles.inputCol}>
                        <Text style={styles.inputLabel}>Activity Level</Text>
                        <View style={styles.optionRow}>
                            {activityOptions.map((opt) => (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.optionBtn, activityLevel === opt.id && styles.optionBtnActive]}
                                    onPress={() => setActivityLevel(opt.id)}
                                >
                                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                                    <Text style={[styles.optionBtnText, activityLevel === opt.id && styles.optionBtnTextActive]}>{opt.id}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Weights Section */}
                <WeightSlider
                    label="Current Weight"
                    value={currentWeight}
                    setValue={setCurrentWeight}
                    min={30}
                    max={200}
                    icon="🏋️"
                    color="#4ECDC4"
                />

                <WeightSlider
                    label="Target Weight"
                    value={targetWeight}
                    setValue={setTargetWeight}
                    min={30}
                    max={200}
                    icon="🎯"
                    color="#FF9500"
                />

                {/* BMI \u0026 Difference Row */}
                <View style={styles.row}>
                    <View style={styles.miniCard}>
                        <Text style={styles.miniLabel}>Goal BMI</Text>
                        <Text style={[styles.miniValue, { color: bmiInfo.color }]}>{calculateBMI()}</Text>
                    </View>
                    <View style={styles.miniCard}>
                        <Text style={styles.miniLabel}>To {targetWeight < currentWeight ? 'Lose' : 'Gain'}</Text>
                        <Text style={styles.miniValue}>{weightDiff} kg</Text>
                    </View>
                </View>

                {/* Timeline Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardInfoTitle}>Goal Timeline</Text>
                    <View style={styles.durationGrid}>
                        {durationOptions.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.durationBtn, goalDuration === opt.value && styles.durationBtnActive]}
                                onPress={() => setGoalDuration(opt.value)}
                            >
                                <Text style={[styles.durationText, goalDuration === opt.value && styles.durationTextActive]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={[styles.paceIndicator, { backgroundColor: isHealthyPace ? theme.success + '10' : theme.warning + '10' }]}>
                        <Ionicons name={isHealthyPace ? "checkmark-circle" : "warning"} size={16} color={isHealthyPace ? theme.success : theme.warning} />
                        <Text style={[styles.paceText, { color: isHealthyPace ? theme.success : theme.warning }]}>
                            {weeklyChange} kg/week • {isHealthyPace ? 'Healthy Pace' : 'Aggressive Pace'}
                        </Text>
                    </View>
                </View>

                {/* Medical Conditions */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderSmall}>
                        <Ionicons name="medical" size={18} color={theme.error} />
                        <Text style={styles.cardInfoTitle}>Medical Notes</Text>
                    </View>
                    <TextInput
                        style={styles.medicalInput}
                        placeholder="Any injuries or conditions? (Optional)"
                        placeholderTextColor={theme.textMuted}
                        value={medicalConditions}
                        onChangeText={setMedicalConditions}
                        multiline
                    />
                </View>

                {/* Skip Helper Text */}
                <Text style={styles.skipHint}>You can complete this later for better accuracy.</Text>

                <TouchableOpacity style={styles.skipBtn} onPress={() => handleNext(true)}>
                    <Text style={styles.skipBtnText}>Skip for now</Text>
                </TouchableOpacity>

            </ScrollView>

            <View style={styles.footer}>
                <PrimaryButton
                    title="Create My Plan"
                    onPress={() => handleNext(false)}
                    icon={<Ionicons name="sparkles" size={20} color="#fff" />}
                />
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center' },
    stepIndicator: { flexDirection: 'row', gap: 6 },
    stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.border },
    stepDotDone: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.success },
    stepDotActive: { backgroundColor: theme.primary, width: 24 },
    scrollView: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: 100 },
    titleSection: { alignItems: 'center', marginBottom: spacing.xl },
    emoji: { fontSize: 40, marginBottom: spacing.sm },
    title: { fontSize: 24, fontWeight: '700', color: theme.textPrimary },
    subtitle: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
    card: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
    cardInfoTitle: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginBottom: spacing.md },
    inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    inputLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inputLabel: { fontSize: 14, color: theme.textPrimary, fontWeight: '600' },
    inputCol: { marginBottom: spacing.md },
    textInput: { backgroundColor: theme.cardBackgroundLight, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: borderRadius.md, width: 80, textAlign: 'center', color: theme.textPrimary, fontWeight: '700', fontSize: 16 },
    optionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 8 },
    optionBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: theme.cardBackgroundLight, borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'transparent' },
    optionBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    optionBtnText: { fontSize: 13, color: theme.textMuted },
    optionBtnTextActive: { color: '#fff', fontWeight: '700' },
    optionEmoji: { fontSize: 18, marginBottom: 2 },
    row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    miniCard: { flex: 1, backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
    miniLabel: { fontSize: 11, color: theme.textMuted },
    miniValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
    weightCard: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
    weightHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    weightIconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    weightEmoji: { fontSize: 22 },
    weightInfo: { flex: 1 },
    weightLabel: { fontSize: 12, color: theme.textMuted },
    weightValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    weightValue: { fontSize: 28, fontWeight: '800' },
    weightUnit: { fontSize: 14, color: theme.textMuted, marginLeft: 4 },
    sliderTrackWrapper: { height: 30, justifyContent: 'center' },
    sliderTrack: { height: 6, backgroundColor: theme.cardBackgroundLight, borderRadius: 3, position: 'relative' },
    sliderFill: { height: '100%', borderRadius: 3 },
    sliderThumb: { position: 'absolute', top: -9, width: 24, height: 24, borderRadius: 12, marginLeft: -12, alignItems: 'center', justifyContent: 'center', elevation: 3 },
    thumbInner: { width: 8, height: 8, backgroundColor: '#fff', borderRadius: 4 },
    quickRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
    quickBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.cardBackgroundLight, borderRadius: borderRadius.md, borderWidth: 1, borderColor: theme.border },
    quickText: { fontSize: 12, fontWeight: '700' },
    durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
    durationBtn: { width: (width - (spacing.lg * 2 + spacing.lg * 2 + spacing.xs * 5)) / 6, paddingVertical: 8, alignItems: 'center', backgroundColor: theme.cardBackgroundLight, borderRadius: borderRadius.md },
    durationBtnActive: { backgroundColor: theme.primary },
    durationText: { fontSize: 11, color: theme.textMuted },
    durationTextActive: { color: '#fff', fontWeight: '700' },
    paceIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: borderRadius.md },
    paceText: { fontSize: 12, fontWeight: '600' },
    cardHeaderSmall: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    medicalInput: { backgroundColor: theme.cardBackgroundLight, borderRadius: borderRadius.md, padding: spacing.md, color: theme.textPrimary, minHeight: 80, textAlignVertical: 'top' },
    skipHint: { textAlign: 'center', color: theme.textMuted, fontSize: 12, marginTop: spacing.lg },
    skipBtn: { alignSelf: 'center', marginTop: spacing.sm, padding: spacing.sm },
    skipBtnText: { color: theme.primary, fontWeight: '700', textDecorationLine: 'underline' },
    footer: { padding: spacing.lg },
});

export default OnboardingStep2;
