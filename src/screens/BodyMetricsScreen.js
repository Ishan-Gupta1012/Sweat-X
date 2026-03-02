import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const BodyMetricsScreen = ({ navigation }) => {
    const { userData, updateProfile } = useUser();
    const { theme, isDarkMode } = useTheme();
    const [isEditing, setIsEditing] = useState(false);

    const [name, setName] = useState(userData.name || '');
    const [age, setAge] = useState(String(userData.age || '25'));
    const [height, setHeight] = useState(String(userData.height || '170'));
    const [gender, setGender] = useState(userData.gender || 'male');
    const [currentWeight, setCurrentWeight] = useState(String(userData.currentWeight || '70'));

    const styles = useMemo(() => createStyles(theme), [theme]);

    const handleSave = () => {
        updateProfile({
            name,
            age: parseInt(age) || 25,
            height: parseInt(height) || 170,
            gender,
            currentWeight: parseInt(currentWeight) || 70,
        });
        setIsEditing(false);
        Alert.alert('Saved!', 'Your details have been updated.');
    };

    const InputRow = ({ label, value, onChangeText, unit, icon }) => (
        <View style={styles.inputRow}>
            <View style={styles.inputLabel}>
                <Ionicons name={icon} size={20} color={theme.brandProfile} />
                <Text style={styles.labelText}>{label}</Text>
            </View>
            {isEditing ? (
                <View style={[styles.inputWrapper, { backgroundColor: theme.cardBackgroundLight }]}>
                    <TextInput
                        style={[styles.input, { color: theme.textPrimary }]}
                        value={value}
                        onChangeText={onChangeText}
                        keyboardType={label === 'Name' ? 'default' : 'numeric'}
                        placeholderTextColor={theme.textMuted}
                    />
                    {unit && <Text style={styles.unit}>{unit}</Text>}
                </View>
            ) : (
                <Text style={styles.valueText}>{value} {unit}</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Body Metrics</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
                    <Ionicons name={isEditing ? "checkmark" : "create"} size={22} color={isEditing ? theme.success : theme.brandProfile} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={[styles.avatar, { backgroundColor: theme.brandProfile }]}>
                        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || '?'}</Text>
                    </View>
                    {isEditing && <Text style={[styles.editHint, { color: theme.brandProfile }]}>Tap fields to edit</Text>}
                </View>

                {/* Details Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Personal Information</Text>

                    <InputRow label="Name" value={name} onChangeText={setName} icon="person" />
                    <InputRow label="Age" value={age} onChangeText={setAge} unit="years" icon="calendar" />
                    <InputRow label="Height" value={height} onChangeText={setHeight} unit="cm" icon="resize" />
                    <InputRow label="Weight" value={currentWeight} onChangeText={setCurrentWeight} unit="kg" icon="scale" />

                    {/* Gender Selection */}
                    <View style={styles.genderRow}>
                        <View style={styles.inputLabel}>
                            <Ionicons name="male-female" size={20} color={theme.brandProfile} />
                            <Text style={styles.labelText}>Gender</Text>
                        </View>
                        {isEditing ? (
                            <View style={styles.genderBtns}>
                                {['male', 'female', 'other'].map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[styles.genderBtn, { backgroundColor: theme.cardBackgroundLight }, gender === g && { backgroundColor: theme.brandProfile }]}
                                        onPress={() => setGender(g)}
                                    >
                                        <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.valueText}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</Text>
                        )}
                    </View>
                </View>

                {/* AI Prompt */}
                <TouchableOpacity
                    style={styles.aiPrompt}
                    onPress={() => navigation.navigate('AIChat', {
                        initialMessage: "I'm looking at my body metrics. Unsure about my current weight or BMI goal. Can you guide me?"
                    })}
                >
                    <Ionicons name="sparkles" size={14} color={theme.brandProfile} />
                    <Text style={[styles.aiPromptText, { color: theme.textSecondary }]}>
                        Unsure about the weight? <Text style={{ color: theme.brandProfile, fontWeight: '700' }}>Ask TrueGuide</Text>
                    </Text>
                </TouchableOpacity>

                {/* BMI Card */}
                <View style={styles.bmiCard}>
                    <Ionicons name="analytics" size={28} color={theme.brandProfile} />
                    <View style={styles.bmiInfo}>
                        <Text style={styles.bmiLabel}>Your BMI</Text>
                        <Text style={styles.bmiValue}>
                            {(() => {
                                const w = parseFloat(currentWeight);
                                const h = parseFloat(height);
                                if (!w || !h) return '0.0';
                                return (w / Math.pow(h / 100, 2)).toFixed(1);
                            })()}
                        </Text>
                    </View>
                    <View style={[styles.bmiTag, { backgroundColor: theme.success + '20' }]}>
                        <Text style={[styles.bmiTagText, { color: theme.success }]}>
                            {(() => {
                                const w = parseFloat(currentWeight);
                                const h = parseFloat(height);
                                if (!w || !h) return '—';
                                const bmi = w / Math.pow(h / 100, 2);
                                if (bmi < 18.5) return 'Underweight';
                                if (bmi < 25) return 'Healthy';
                                if (bmi < 30) return 'Overweight';
                                return 'Obese';
                            })()}
                        </Text>
                    </View>
                </View>

                {/* Save Button */}
                {isEditing && (
                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.success }]} onPress={handleSave}>
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView >
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center' },
    editBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },

    avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
    avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
    editHint: { fontSize: 12, marginTop: spacing.sm },

    card: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
    cardTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: spacing.lg },

    inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
    inputLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    labelText: { fontSize: 15, color: theme.textSecondary },
    valueText: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, paddingHorizontal: spacing.md },
    input: { fontSize: 16, paddingVertical: spacing.sm, minWidth: 60, textAlign: 'right' },
    unit: { fontSize: 14, color: theme.textMuted, marginLeft: 4 },

    genderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
    genderBtns: { flexDirection: 'row', gap: spacing.xs },
    genderBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
    genderBtnText: { fontSize: 13, color: theme.textMuted },
    genderBtnTextActive: { color: '#fff', fontWeight: '600' },

    bmiCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
    bmiInfo: { flex: 1, marginLeft: spacing.md },
    bmiLabel: { fontSize: 12, color: theme.textMuted },
    bmiValue: { fontSize: 28, fontWeight: '800', color: theme.textPrimary },
    bmiTag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.xl },
    bmiTagText: { fontSize: 12, fontWeight: '600' },

    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.xl, marginBottom: spacing.lg },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    aiPrompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: spacing.lg, paddingVertical: 8 },
    aiPromptText: { fontSize: 13 },
});

export default BodyMetricsScreen;
