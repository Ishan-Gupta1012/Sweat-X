import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const GoalsScreen = ({ navigation }) => {
    const { userData, updateProfile, recalculateGoals } = useUser();
    const { theme, isDarkMode } = useTheme();
    const [showModal, setShowModal] = useState(false);
    const [showEditGoalModal, setShowEditGoalModal] = useState(false);
    const [todayWeight, setTodayWeight] = useState('');

    // Temporary state for editing goals
    const [tempTargetWeight, setTempTargetWeight] = useState(String(userData.targetWeight || 65));
    const [tempCurrentWeight, setTempCurrentWeight] = useState(String(userData.currentWeight || 70));
    const [tempGoalDuration, setTempGoalDuration] = useState(String(userData.goalDuration || 12));

    const currentWeight = userData.currentWeight || 70;
    const targetWeight = userData.targetWeight || 65;
    const goalDuration = userData.goalDuration || 12;

    const weightHistory = userData.weightHistory || [
        { date: getDateString(-6), weight: currentWeight + 2 },
        { date: getDateString(-5), weight: currentWeight + 1.5 },
        { date: getDateString(-4), weight: currentWeight + 1 },
        { date: getDateString(-3), weight: currentWeight + 0.8 },
        { date: getDateString(-2), weight: currentWeight + 0.5 },
        { date: getDateString(-1), weight: currentWeight + 0.2 },
        { date: getDateString(0), weight: currentWeight },
    ];

    function getDateString(daysOffset) {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    const weights = weightHistory.map(h => h.weight);
    const minWeight = Math.min(...weights, targetWeight) - 2;
    const maxWeight = Math.max(...weights) + 2;
    const range = maxWeight - minWeight;

    const handleAddWeight = () => {
        if (!todayWeight) return;
        const newWeight = parseFloat(todayWeight);
        const today = getDateString(0);

        const newHistory = weightHistory.filter(h => h.date !== today);
        newHistory.push({ date: today, weight: newWeight });

        const sorted = newHistory.slice(-7);

        updateProfile({
            currentWeight: newWeight,
            weightHistory: sorted,
        });

        setShowModal(false);
        setTodayWeight('');
    };

    const handleSaveGoal = async () => {
        const newTarget = parseFloat(tempTargetWeight);
        const newCurrent = parseFloat(tempCurrentWeight);
        const newDuration = parseInt(tempGoalDuration);

        if (isNaN(newTarget) || isNaN(newCurrent) || isNaN(newDuration)) return;

        const updatedData = {
            ...userData,
            currentWeight: newCurrent,
            targetWeight: newTarget,
            goalDuration: newDuration,
        };

        // Update profile
        await updateProfile({
            currentWeight: newCurrent,
            targetWeight: newTarget,
            goalDuration: newDuration,
        });

        // Recalculate calorie and macro goals
        recalculateGoals(updatedData);

        setShowEditGoalModal(false);
    };

    const weightDiff = currentWeight - targetWeight;
    const progressPercent = Math.max(0, Math.min(100, 100 - (Math.abs(weightDiff) / 20) * 100));

    const weeklyChange = goalDuration > 0 ? (Math.abs(weightDiff) / goalDuration).toFixed(2) : 0;
    const isHealthyPace = weeklyChange <= 1;

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + (goalDuration * 7));
    const completionDateStr = completionDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="theme.textPrimary" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>GOALS & TARGETS</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Weight Goal Card */}
                <View style={styles.goalCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.goalTitle}>WEIGHT GOAL</Text>
                        <TouchableOpacity
                            style={[styles.editBtn, { backgroundColor: '#D3540020' }]}
                            onPress={() => {
                                setTempTargetWeight(String(targetWeight));
                                setTempCurrentWeight(String(currentWeight));
                                setTempGoalDuration(String(goalDuration));
                                setShowEditGoalModal(true);
                            }}
                        >
                            <Ionicons name="create-outline" size={16} color={theme.brandProfile} />
                            <Text style={[styles.editBtnText, { color: theme.brandProfile }]}>Edit Goal</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.weightRow}>
                        <View style={styles.weightBox}>
                            <Text style={styles.weightLabel}>Current</Text>
                            <Text style={styles.weightValue}>{currentWeight}</Text>
                            <Text style={styles.weightUnit}>KG</Text>
                        </View>
                        <View style={styles.arrowContainer}>
                            <Ionicons name="arrow-forward" size={28} color={theme.brandProfile} />
                        </View>
                        <View style={styles.weightBox}>
                            <Text style={styles.weightLabel}>Target</Text>
                            <Text style={[styles.weightValue, { color: theme.success }]}>{targetWeight}</Text>
                            <Text style={styles.weightUnit}>kg</Text>
                        </View>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: theme.cardBackgroundLight }]}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: theme.success }]} />
                    </View>
                    <Text style={styles.progressText}>
                        {weightDiff > 0 ? `${weightDiff.toFixed(1)} kg to lose` :
                            weightDiff < 0 ? `${Math.abs(weightDiff).toFixed(1)} kg to gain` :
                                'Goal Achieved! 🎉'}
                    </Text>
                </View>

                {/* Timeline Card */}
                {currentWeight !== targetWeight && (
                    <View style={styles.timelineCard}>
                        <View style={styles.timelineRow}>
                            <View style={styles.timelineItem}>
                                <Ionicons name="time" size={24} color={theme.brandProfile} />
                                <Text style={styles.timelineValue}>{goalDuration}</Text>
                                <Text style={styles.timelineLabel}>weeks</Text>
                            </View>
                            <View style={styles.timelineDivider} />
                            <View style={styles.timelineItem}>
                                <Ionicons name="trending-down" size={24} color={isHealthyPace ? theme.success : theme.warning} />
                                <Text style={[styles.timelineValue, { color: isHealthyPace ? theme.success : theme.warning }]}>
                                    {weeklyChange}
                                </Text>
                                <Text style={styles.timelineLabel}>kg/week</Text>
                            </View>
                            <View style={styles.timelineDivider} />
                            <View style={styles.timelineItem}>
                                <Ionicons name="calendar" size={24} color={theme.brandProfile} />
                                <Text style={styles.timelineValue}>{completionDateStr.split(',')[0]}</Text>
                                <Text style={styles.timelineLabel}>target date</Text>
                            </View>
                        </View>
                        <View style={[styles.paceIndicator, { backgroundColor: isHealthyPace ? theme.success + '15' : theme.warning + '15' }]}>
                            <Ionicons
                                name={isHealthyPace ? "checkmark-circle" : "warning"}
                                size={16}
                                color={isHealthyPace ? theme.success : theme.warning}
                            />
                            <Text style={[styles.paceText, { color: isHealthyPace ? theme.success : theme.warning }]}>
                                {isHealthyPace ? 'Healthy & sustainable pace' : 'Aggressive pace - consider extending timeline'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Weekly Graph */}
                <View style={styles.graphCard}>
                    <View style={styles.graphHeader}>
                        <Text style={styles.graphTitle}>PROGRESS TRACKER</Text>
                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.brandProfile }]} onPress={() => setShowModal(true)}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.addBtnText}>Log Today</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Graph */}
                    <View style={styles.graph}>
                        <View style={styles.yAxis}>
                            <Text style={styles.yLabel}>{maxWeight.toFixed(0)}</Text>
                            <Text style={styles.yLabel}>{((maxWeight + minWeight) / 2).toFixed(0)}</Text>
                            <Text style={styles.yLabel}>{minWeight.toFixed(0)}</Text>
                        </View>

                        <View style={styles.barsContainer}>
                            <View style={[styles.targetLine, {
                                bottom: `${((targetWeight - minWeight) / range) * 100}%`,
                                borderTopColor: theme.success
                            }]}>
                                <Text style={[styles.targetLabel, { color: theme.success }]}>Target: {targetWeight}kg</Text>
                            </View>

                            {weightHistory.map((item, index) => {
                                const height = ((item.weight - minWeight) / range) * 100;
                                const isToday = index === weightHistory.length - 1;
                                return (
                                    <View key={index} style={styles.barWrapper}>
                                        <View style={[
                                            styles.bar,
                                            { height: `${height}%`, backgroundColor: isToday ? theme.brandProfile : theme.brandProfile + '40' },
                                        ]}>
                                            <Text style={[styles.barValue, { color: isToday ? '#fff' : theme.textPrimary }]}>{item.weight}</Text>
                                        </View>
                                        <Text style={styles.barLabel}>{item.date}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="trending-down" size={24} color={theme.success} />
                        <Text style={styles.statValue}>
                            {weights.length > 1 ? (Math.max(0, weights[0] - weights[weights.length - 1])).toFixed(1) : '0'}
                        </Text>
                        <Text style={styles.statLabel}>kg lost this week</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="calendar" size={24} color={theme.warning} />
                        <Text style={styles.statValue}>{weightHistory.length}</Text>
                        <Text style={styles.statLabel}>days tracked</Text>
                    </View>
                </View>

                {/* Tip */}
                <View style={[styles.tipCard, { backgroundColor: theme.warning + '15' }]}>
                    <Ionicons name="bulb" size={24} color={theme.warning} />
                    <Text style={styles.tipText}>
                        Log your weight daily in the morning for best accuracy. Consistency is key!
                    </Text>
                </View>
            </ScrollView>

            {/* Add Weight Modal */}
            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Log Today's Weight</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <View style={styles.modalInput}>
                                <TextInput
                                    style={styles.weightInput}
                                    value={todayWeight}
                                    onChangeText={setTodayWeight}
                                    keyboardType="decimal-pad"
                                    placeholder={String(currentWeight)}
                                    placeholderTextColor={theme.textMuted}
                                    autoFocus
                                />
                                <Text style={styles.inputUnit}>kg</Text>
                            </View>
                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.success }]} onPress={handleAddWeight}>
                                <Ionicons name="checkmark" size={22} color="#fff" />
                                <Text style={styles.saveBtnText}>Save Weight</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Goal Modal */}
            <Modal visible={showEditGoalModal} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Your Goal</Text>
                            <TouchableOpacity onPress={() => setShowEditGoalModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Current Weight (kg)</Text>
                            <View style={styles.modalInput}>
                                <TextInput
                                    style={styles.weightInput}
                                    value={tempCurrentWeight}
                                    onChangeText={setTempCurrentWeight}
                                    keyboardType="decimal-pad"
                                    placeholderTextColor={theme.textMuted}
                                />
                                <Text style={styles.inputUnit}>kg</Text>
                            </View>

                            <Text style={styles.inputLabel}>Target Weight (kg)</Text>
                            <View style={styles.modalInput}>
                                <TextInput
                                    style={styles.weightInput}
                                    value={tempTargetWeight}
                                    onChangeText={setTempTargetWeight}
                                    keyboardType="decimal-pad"
                                    placeholderTextColor={theme.textMuted}
                                />
                                <Text style={styles.inputUnit}>kg</Text>
                            </View>

                            <Text style={styles.inputLabel}>Goal Duration (weeks)</Text>
                            <View style={styles.modalInput}>
                                <TextInput
                                    style={styles.weightInput}
                                    value={tempGoalDuration}
                                    onChangeText={setTempGoalDuration}
                                    keyboardType="number-pad"
                                    placeholderTextColor={theme.textMuted}
                                />
                                <Text style={styles.inputUnit}>wks</Text>
                            </View>

                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.brandProfile }]} onPress={handleSaveGoal}>
                                <Ionicons name="save" size={22} color="#fff" />
                                <Text style={styles.saveBtnText}>Save Goal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    headerTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, letterSpacing: 2 },
    scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40, paddingTop: spacing.md },

    goalCard: { backgroundColor: theme.cardBackground, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    goalTitle: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, letterSpacing: 1 },
    editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
    editBtnText: { fontSize: 12, fontWeight: '600' },
    weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: spacing.lg },
    weightBox: { alignItems: 'center' },
    weightLabel: { fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    weightValue: { fontSize: 40, fontWeight: '700', color: theme.textPrimary },
    weightUnit: { fontSize: 12, color: theme.textSecondary, fontWeight: '500' },
    arrowContainer: { padding: spacing.sm },
    progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.sm, backgroundColor: '#222222' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', fontWeight: '500' },

    timelineCard: { backgroundColor: theme.cardBackground, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    timelineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: spacing.md },
    timelineItem: { alignItems: 'center' },
    timelineValue: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginTop: 4 },
    timelineLabel: { fontSize: 10, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    timelineDivider: { width: 1, height: 32, backgroundColor: theme.border },
    paceIndicator: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 10, borderRadius: 10 },
    paceText: { fontSize: 12, fontWeight: '500' },

    graphCard: { backgroundColor: theme.cardBackground, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    graphHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
    graphTitle: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, letterSpacing: 1 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    addBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

    graph: { flexDirection: 'row', height: 180 },
    yAxis: { width: 35, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: spacing.xs },
    yLabel: { fontSize: 10, color: theme.textSecondary, fontWeight: '500' },
    barsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' },
    targetLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dotted' },
    targetLabel: { position: 'absolute', right: 0, top: -18, fontSize: 10, fontWeight: '600' },
    barWrapper: { alignItems: 'center', flex: 1 },
    bar: { width: 20, borderRadius: 6, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 },
    barValue: { fontSize: 9, fontWeight: '600' },
    barLabel: { fontSize: 10, color: theme.textSecondary, marginTop: 8, fontWeight: '500' },

    statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    statCard: { flex: 1, backgroundColor: theme.cardBackground, borderRadius: 16, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    statValue: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, marginTop: spacing.sm },
    statLabel: { fontSize: 10, color: theme.textSecondary, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },

    tipCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: '#F59E0B20' },
    tipText: { flex: 1, fontSize: 13, color: theme.textSecondary, lineHeight: 20, fontWeight: '400' },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', paddingHorizontal: spacing.xl },
    modalCard: { borderRadius: 24, padding: spacing.xl, width: '100%', borderWidth: 1, borderColor: theme.border },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
    modalTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
    modalBody: { gap: spacing.lg },
    inputLabel: { fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginBottom: -spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
    modalInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.cardBackground, borderRadius: 14, paddingVertical: spacing.sm, borderWidth: 1, borderColor: theme.border },
    weightInput: { fontSize: 32, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', paddingHorizontal: spacing.md, minWidth: 100 },
    inputUnit: { fontSize: 16, color: theme.textSecondary, fontWeight: '500' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 16, borderRadius: 14, marginTop: spacing.md },
    saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff', letterSpacing: 1, textTransform: 'uppercase' },
});

export default GoalsScreen;
