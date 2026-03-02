import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import PrimaryButton from '../components/PrimaryButton';

const BeginnerSetupScreen = ({ navigation, route }) => {
    const { theme, isDarkMode } = useTheme();
    const { generateTrainingPlan } = useUser();
    const preset = route?.params?.preset;

    const [step, setStep] = useState(1);
    const [prefs, setPrefs] = useState({
        trainingLevel: 'beginner',
        daysPerWeek: 3,
        duration: 45,
        equipment: []
    });

    useEffect(() => {
        if (preset) {
            generateTrainingPlan({ ...prefs, preset });
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp' }],
            });
        }
    }, [preset]);

    const styles = useMemo(() => createStyles(theme), [theme]);

    const levelOptions = [
        { id: 'beginner', label: 'Beginner', sub: '0–6 months exp.', why: 'Focus on form & skill' },
        { id: 'intermediate', label: 'Intermediate', sub: '6–24 months exp.', why: 'Hypertrophy & recovery' },
        { id: 'advanced', label: 'Advanced', sub: '2+ years exp.', why: 'Precision & autonomy' },
    ];

    const equipmentOptions = [
        { id: 'dumbbells', label: 'Dumbbells', icon: 'barbell' },
        { id: 'barbell', label: 'Barbell', icon: 'barbell' },
        { id: 'bench', label: 'Bench', icon: 'square' },
        { id: 'machines', label: 'Machines', icon: 'settings' },
        { id: 'cables', label: 'Cables', icon: 'link' },
        { id: 'bodyweight', label: 'Bodyweight', icon: 'body' },
    ];

    const toggleEquipment = (id) => {
        setPrefs(prev => ({
            ...prev,
            equipment: prev.equipment.includes(id)
                ? prev.equipment.filter(i => i !== id)
                : [...prev.equipment, id]
        }));
    };

    const handleFinish = () => {
        generateTrainingPlan(prefs);
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Plan Builder</Text>
                <Text style={styles.stepIndicator}>{step}/4</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {step === 1 && (
                    <View>
                        <Text style={styles.title}>Experience Level</Text>
                        <Text style={styles.subtitle}>This helps us choose safe volume & frequency</Text>
                        <View style={styles.levelContainer}>
                            {levelOptions.map(opt => (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.levelCard, prefs.trainingLevel === opt.id && styles.cardSelected]}
                                    onPress={() => setPrefs({ ...prefs, trainingLevel: opt.id })}
                                >
                                    <View style={styles.levelInfo}>
                                        <Text style={[styles.levelLabel, prefs.trainingLevel === opt.id && styles.selectedText]}>{opt.label}</Text>
                                        <Text style={[styles.levelSub, prefs.trainingLevel === opt.id && styles.selectedText]}>{opt.sub}</Text>
                                    </View>
                                    <View style={[styles.whyBadge, { backgroundColor: prefs.trainingLevel === opt.id ? 'rgba(255,255,255,0.2)' : theme.cardBackgroundLight }]}>
                                        <Text style={[styles.whyText, { color: prefs.trainingLevel === opt.id ? '#fff' : theme.primary }]}>{opt.why}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {step === 2 && (
                    <View>
                        <Text style={styles.title}>Commitment Level</Text>
                        <Text style={styles.subtitle}>How many days per week can you train?</Text>
                        <View style={styles.optionsRow}>
                            {[1, 2, 3, 4, 5, 6].map(num => (
                                <TouchableOpacity
                                    key={num}
                                    style={[styles.smallCard, prefs.daysPerWeek === num && styles.cardSelected]}
                                    onPress={() => setPrefs({ ...prefs, daysPerWeek: num })}
                                >
                                    <Text style={[styles.cardTitle, prefs.daysPerWeek === num && styles.selectedText]}>{num}</Text>
                                    <Text style={[styles.cardSubtitle, prefs.daysPerWeek === num && styles.selectedText]}>Days</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {step === 3 && (
                    <View>
                        <Text style={styles.title}>Session Duration</Text>
                        <Text style={styles.subtitle}>Roughly how long is each workout?</Text>
                        <View style={styles.optionsRow}>
                            {[30, 45, 60, 75, 90].map(mins => (
                                <TouchableOpacity
                                    key={mins}
                                    style={[styles.smallCard, prefs.duration === mins && styles.cardSelected]}
                                    onPress={() => setPrefs({ ...prefs, duration: mins })}
                                >
                                    <Text style={[styles.cardTitle, prefs.duration === mins && styles.selectedText]}>{mins}</Text>
                                    <Text style={[styles.cardSubtitle, prefs.duration === mins && styles.selectedText]}>Mins</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {step === 4 && (
                    <View>
                        <Text style={styles.title}>Your Arsenal</Text>
                        <Text style={styles.subtitle}>What equipment do you have access to?</Text>
                        <View style={styles.grid}>
                            {equipmentOptions.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.gridCard, prefs.equipment.includes(item.id) && styles.cardSelected]}
                                    onPress={() => toggleEquipment(item.id)}
                                >
                                    <Ionicons name={item.icon} size={24} color={prefs.equipment.includes(item.id) ? '#fff' : theme.primary} />
                                    <Text style={[styles.gridLabel, prefs.equipment.includes(item.id) && styles.selectedText]}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <PrimaryButton
                    title={step === 4 ? "Generate My Plan" : "Continue"}
                    onPress={() => step < 4 ? setStep(step + 1) : handleFinish()}
                />
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
    headerTitle: { fontSize: 18, fontWeight: '900', color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
    stepIndicator: { fontSize: 14, fontWeight: '900', color: theme.primary },
    content: { padding: spacing.lg },
    title: { fontSize: 32, fontWeight: '900', color: theme.textPrimary, marginBottom: spacing.xs, letterSpacing: -1 },
    subtitle: { fontSize: 16, color: theme.textSecondary, marginBottom: spacing.xl, fontWeight: '600' },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    smallCard: { width: '28%', paddingVertical: 20, backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1.5, borderColor: theme.border },
    cardSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
    cardTitle: { fontSize: 24, fontWeight: '900', color: theme.textPrimary },
    cardSubtitle: { fontSize: 10, fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase' },
    selectedText: { color: '#fff' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    gridCard: { width: '47%', height: 100, backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: theme.border },
    gridLabel: { fontSize: 12, fontWeight: '900', color: theme.textPrimary, textTransform: 'uppercase' },
    footer: { padding: spacing.lg, borderTopWidth: 1.5, borderTopColor: theme.border },
    levelContainer: { gap: spacing.md },
    levelCard: { padding: spacing.lg, backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    levelInfo: { flex: 1 },
    levelLabel: { fontSize: 18, fontWeight: '900', color: theme.textPrimary, textTransform: 'uppercase', marginBottom: 2 },
    levelSub: { fontSize: 12, fontWeight: '700', color: theme.textMuted },
    whyBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
    whyText: { fontSize: 10, fontWeight: '900' },
});

export default BeginnerSetupScreen;
