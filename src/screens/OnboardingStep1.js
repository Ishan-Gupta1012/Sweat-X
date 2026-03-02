import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '../constants/colors';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const OnboardingStep1 = ({ navigation }) => {
    const { userData, updateProfile } = useUser();
    const { theme, isDarkMode } = useTheme();
    const [name, setName] = useState(userData.name || '');
    const [age, setAge] = useState(userData.age || '25');
    const [selectedGoal, setSelectedGoal] = useState(userData.primaryGoal || 'muscle_gain');
    const [showAgePicker, setShowAgePicker] = useState(false);

    const ages = Array.from({ length: 100 }, (_, i) => (i + 1).toString());

    const goalOptions = [
        { id: 'weight_loss', label: 'Fat Loss', icon: 'flame', color: '#FF9500', emoji: '🔥' },
        { id: 'muscle_gain', label: 'Muscle Gain', icon: 'barbell', color: '#4ECDC4', emoji: '💪' },
        { id: 'general_fitness', label: 'Stay Fit', icon: 'heart', color: '#FF9F43', emoji: '❤️' },
    ];

    const handleNext = () => {
        if (!name.trim()) {
            Alert.alert('Welcome!', 'Please tell us your name so we can personalize your experience.');
            return;
        }
        updateProfile({
            name,
            age,
            primaryGoal: selectedGoal,
        });
        navigation.navigate('OnboardingStep2');
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Decorative Elements */}
            <View style={styles.bgGradient1} />
            <View style={styles.bgGradient2} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                    <View style={styles.stepDot} />
                    <View style={styles.stepDot} />
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.emoji}>✨</Text>
                    <Text style={styles.title}>Let's Create Your</Text>
                    <Text style={styles.titleAccent}>Perfect Plan</Text>
                    <Text style={styles.subtitle}>Tell us about yourself</Text>
                </View>

                {/* Name Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-circle" size={24} color={theme.primary} />
                        <Text style={styles.cardTitle}>Your Name</Text>
                    </View>
                    <TextInput
                        style={styles.nameInput}
                        placeholder="Enter your name"
                        placeholderTextColor={theme.textMuted}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Age Picker Card */}
                <TouchableOpacity style={styles.card} onPress={() => setShowAgePicker(true)}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="calendar" size={24} color={theme.primary} />
                        <Text style={styles.cardTitle}>Your Age</Text>
                    </View>
                    <View style={styles.ageValueRow}>
                        <Text style={styles.valueNumber}>{age}</Text>
                        <Text style={styles.valueUnit}>years</Text>
                        <Ionicons name="chevron-down" size={20} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
                    </View>
                </TouchableOpacity>

                {/* Goal Selection Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="trophy" size={24} color={theme.warning} />
                        <Text style={styles.cardTitle}>What's your primary goal?</Text>
                    </View>
                    <View style={styles.goalsGrid}>
                        {goalOptions.map((goal) => {
                            const isSelected = selectedGoal === goal.id;
                            return (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={[
                                        styles.goalItem,
                                        isSelected && { borderColor: goal.color, backgroundColor: goal.color + '10' }
                                    ]}
                                    onPress={() => setSelectedGoal(goal.id)}
                                >
                                    <View style={[styles.goalIconBg, { backgroundColor: goal.color + '20' }]}>
                                        <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.goalLabel, isSelected && { color: goal.color }]}>{goal.label}</Text>
                                    </View>
                                    <View style={[styles.radio, isSelected && { borderColor: goal.color }]}>
                                        {isSelected && <View style={[styles.radioInner, { backgroundColor: goal.color }]} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Age Picker Modal */}
            <Modal visible={showAgePicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Select Age</Text>
                            <TouchableOpacity onPress={() => setShowAgePicker(false)}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={ages}
                            keyExtractor={(item) => item}
                            showsVerticalScrollIndicator={false}
                            style={styles.ageList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.ageItem, age === item && styles.ageItemSelected]}
                                    onPress={() => { setAge(item); setShowAgePicker(false); }}
                                >
                                    <Text style={[styles.ageItemText, age === item && styles.ageItemTextSelected]}>
                                        {item} years
                                    </Text>
                                </TouchableOpacity>
                            )}
                            getItemLayout={(data, index) => ({ length: 50, offset: 50 * index, index })}
                            initialScrollIndex={Math.max(0, parseInt(age) - 5)}
                        />
                    </View>
                </View>
            </Modal>

            {/* Footer */}
            <View style={styles.footer}>
                <PrimaryButton
                    title="Continue"
                    onPress={handleNext}
                    icon={<Ionicons name="arrow-forward" size={20} color="#fff" />}
                />
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    bgGradient1: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: theme.primary + '10' },
    bgGradient2: { position: 'absolute', bottom: 100, left: -80, width: 160, height: 160, borderRadius: 80, backgroundColor: '#A55EEA10' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center' },
    stepIndicator: { flexDirection: 'row', gap: 6 },
    stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.border },
    stepDotActive: { backgroundColor: theme.primary, width: 24 },
    scrollView: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: 100 },
    titleContainer: { marginBottom: spacing.xl, alignItems: 'center' },
    emoji: { fontSize: 40, marginBottom: spacing.sm },
    title: { fontSize: 26, fontWeight: '700', color: theme.textPrimary },
    titleAccent: { fontSize: 30, fontWeight: '800', color: theme.primary },
    subtitle: { fontSize: 14, color: theme.textMuted, marginTop: spacing.xs },
    card: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    cardTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, flex: 1 },
    nameInput: { backgroundColor: theme.cardBackgroundLight, borderRadius: borderRadius.md, padding: spacing.md, color: theme.textPrimary, fontSize: 16 },
    ageValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
    valueNumber: { fontSize: 28, fontWeight: '700', color: theme.textPrimary },
    valueUnit: { fontSize: 12, color: theme.textMuted },
    goalsGrid: { gap: spacing.sm },
    goalItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: theme.cardBackgroundLight, borderRadius: borderRadius.lg, marginBottom: spacing.sm, borderWidth: 2, borderColor: 'transparent' },
    goalIconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    goalEmoji: { fontSize: 22 },
    goalLabel: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    radioInner: { width: 12, height: 12, borderRadius: 6 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    pickerModal: { backgroundColor: theme.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%' },
    pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.border },
    pickerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    ageList: { paddingHorizontal: spacing.lg },
    ageItem: { paddingVertical: spacing.md, alignItems: 'center' },
    ageItemSelected: { backgroundColor: theme.primary + '20', borderRadius: borderRadius.md },
    ageItemText: { fontSize: 18, color: theme.textPrimary },
    ageItemTextSelected: { fontWeight: '700', color: theme.primary },
    footer: { padding: spacing.lg },
});

export default OnboardingStep1;
