import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const WorkoutHistoryScreen = ({ navigation }) => {
    const { userData, getTodayDate } = useUser();
    const { theme, isDarkMode } = useTheme();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(getTodayDate());

    const workoutHistory = userData.workoutHistory || [];

    const getWorkoutsForDate = (dateString) => {
        return workoutHistory.filter(workout => {
            const workoutDate = workout.date ? workout.date.split('T')[0] : null;
            return workoutDate === dateString;
        });
    };

    const getDatesWithWorkouts = () => {
        const dates = new Set();
        workoutHistory.forEach(workout => {
            if (workout.date) {
                const dateStr = workout.date.split('T')[0];
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                if (new Date(dateStr) >= thirtyDaysAgo) {
                    dates.add(dateStr);
                }
            }
        });
        return Array.from(dates);
    };

    const datesWithData = getDatesWithWorkouts();
    const workoutsForSelectedDate = getWorkoutsForDate(selectedDate);
    const styles = useMemo(() => createStyles(theme), [theme]);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;

        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(i);
        }

        return days;
    };

    const formatDateString = (day) => {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return `${year}-${month}-${dayStr}`;
    };

    const isToday = (day) => {
        if (!day) return false;
        return formatDateString(day) === getTodayDate();
    };

    const hasData = (day) => {
        if (!day) return false;
        return datesWithData.includes(formatDateString(day));
    };

    const isSelected = (day) => {
        if (!day) return false;
        return formatDateString(day) === selectedDate;
    };

    const isFutureDate = (day) => {
        if (!day) return false;
        const dateStr = formatDateString(day);
        return dateStr > getTodayDate();
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
        if (next <= new Date()) {
            setCurrentMonth(next);
        }
    };

    const handleDayPress = (day) => {
        if (day && !isFutureDate(day)) {
            setSelectedDate(formatDateString(day));
        }
    };

    const formatDisplayDate = (dateStr) => {
        const date = new Date(dateStr);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const getWorkoutIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'chest': return '💪';
            case 'back': return '🏋️';
            case 'legs': return '🦵';
            case 'shoulders': return '🏆';
            case 'arms': return '💪';
            case 'core': return '🧘';
            case 'cardio': return '🏃';
            default: return '🏋️';
        }
    };

    const days = getDaysInMonth(currentMonth);

    const totalCaloriesBurned = workoutsForSelectedDate.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    const totalDuration = workoutsForSelectedDate.reduce((sum, w) => sum + (w.duration || 0), 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Workout History</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Month Navigation */}
                <View style={styles.monthNav}>
                    <TouchableOpacity style={styles.monthBtn} onPress={prevMonth}>
                        <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </Text>
                    <TouchableOpacity
                        style={[styles.monthBtn, currentMonth.getMonth() >= new Date().getMonth() &&
                            currentMonth.getFullYear() >= new Date().getFullYear() && styles.monthBtnDisabled]}
                        onPress={nextMonth}
                    >
                        <Ionicons name="chevron-forward" size={24}
                            color={currentMonth.getMonth() >= new Date().getMonth() &&
                                currentMonth.getFullYear() >= new Date().getFullYear()
                                ? theme.textMuted : theme.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Calendar */}
                <View style={styles.calendar}>
                    {/* Day headers */}
                    <View style={styles.dayHeaders}>
                        {dayNames.map((day, i) => (
                            <Text key={i} style={styles.dayHeader}>{day}</Text>
                        ))}
                    </View>

                    {/* Days grid */}
                    <View style={styles.daysGrid}>
                        {days.map((day, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.dayCell,
                                    isSelected(day) && styles.dayCellSelected,
                                    isToday(day) && styles.dayCellToday,
                                    isFutureDate(day) && styles.dayCellDisabled,
                                ]}
                                onPress={() => handleDayPress(day)}
                                disabled={!day || isFutureDate(day)}
                            >
                                {day && (
                                    <>
                                        <Text style={[
                                            styles.dayText,
                                            isSelected(day) && styles.dayTextSelected,
                                            isFutureDate(day) && styles.dayTextDisabled,
                                        ]}>
                                            {day}
                                        </Text>
                                        {hasData(day) && (
                                            <View style={[
                                                styles.dataDot,
                                                isSelected(day) && styles.dataDotSelected,
                                                { backgroundColor: isSelected(day) ? '#fff' : theme.brandWorkout }
                                            ]} />
                                        )}
                                    </>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Selected Date Info */}
                <View style={styles.dateCard}>
                    <View style={styles.dateHeader}>
                        <Ionicons name="calendar" size={20} color={theme.brandWorkout} />
                        <Text style={styles.dateTitle}>{formatDisplayDate(selectedDate)}</Text>
                        {selectedDate === getTodayDate() && (
                            <View style={[styles.todayBadge, { backgroundColor: theme.brandWorkout + '20' }]}>
                                <Text style={[styles.todayText, { color: theme.brandWorkout }]}>Today</Text>
                            </View>
                        )}
                    </View>

                    {/* Summary */}
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Ionicons name="barbell" size={18} color={theme.brandWorkout} />
                            <Text style={styles.summaryValue}>{workoutsForSelectedDate.length}</Text>
                            <Text style={styles.summaryLabel}>workouts</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Ionicons name="flame" size={18} color={theme.error} />
                            <Text style={styles.summaryValue}>{totalCaloriesBurned}</Text>
                            <Text style={styles.summaryLabel}>kcal burned</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Ionicons name="time" size={18} color={theme.success} />
                            <Text style={styles.summaryValue}>{Math.floor(totalDuration / 60)}</Text>
                            <Text style={styles.summaryLabel}>minutes</Text>
                        </View>
                    </View>
                </View>

                {/* Workouts List */}
                <Text style={styles.sectionTitle}>
                    Workouts ({workoutsForSelectedDate.length})
                </Text>

                {workoutsForSelectedDate.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="barbell-outline" size={48} color={theme.textMuted} />
                        <Text style={styles.emptyText}>No workouts logged for this day</Text>
                    </View>
                ) : (
                    <View style={styles.workoutsList}>
                        {workoutsForSelectedDate.map((workout, index) => (
                            <View key={workout.id || index} style={styles.workoutCard}>
                                <View style={styles.workoutHeader}>
                                    <Text style={styles.workoutIcon}>{getWorkoutIcon(workout.zones?.[0] || workout.split)}</Text>
                                    <View style={styles.workoutInfo}>
                                        <Text style={styles.workoutType}>
                                            {workout.title || workout.muscleGroup || 'Workout Session'}
                                        </Text>
                                        <Text style={styles.workoutTime}>
                                            {formatDuration(workout.duration || 0)} • {workout.caloriesBurned || 0} kcal
                                        </Text>
                                    </View>
                                </View>

                                {/* Exercises */}
                                {workout.exercises && workout.exercises.length > 0 && (
                                    <View style={styles.exercisesList}>
                                        <Text style={styles.exercisesTitle}>Exercises ({workout.exercises.length})</Text>
                                        {workout.exercises.map((exercise, i) => (
                                            <View key={i} style={styles.exerciseItem}>
                                                <View style={[styles.exerciseDot, { backgroundColor: theme.brandWorkout }]} />
                                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                                <Text style={styles.exerciseSets}>
                                                    {exercise.sets?.length || 0} sets
                                                </Text>
                                            </View>
                                        ))}
                                        {/* Show detailed sets for each exercise */}
                                        {workout.exercises.map((exercise, i) => (
                                            exercise.sets && exercise.sets.length > 0 && (
                                                <View key={`detail-${i}`} style={styles.setsDetail}>
                                                    <Text style={styles.setsDetailTitle}>{exercise.name}</Text>
                                                    {exercise.sets.map((set, j) => (
                                                        <Text key={j} style={styles.setRow}>
                                                            Set {j + 1}: {set.weight || 0}kg × {set.reps || 0} reps
                                                        </Text>
                                                    ))}
                                                </View>
                                            )
                                        ))}
                                    </View>
                                )}

                                {/* Cardio */}
                                {workout.cardio && workout.cardio.type && (
                                    <View style={styles.cardioSection}>
                                        <Text style={styles.cardioLabel}>🏃 Cardio</Text>
                                        <Text style={styles.cardioInfo}>
                                            {workout.cardio.type} • {workout.cardio.duration} min • {workout.cardio.intensity || 'moderate'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    scroll: { paddingHorizontal: spacing.lg },

    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    monthBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center' },
    monthBtnDisabled: { opacity: 0.5 },
    monthTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },

    calendar: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg },
    dayHeaders: { flexDirection: 'row', marginBottom: spacing.sm },
    dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: theme.textMuted },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    dayCellSelected: { backgroundColor: theme.brandWorkout, borderRadius: 20 },
    dayCellToday: { borderWidth: 2, borderColor: theme.brandWorkout, borderRadius: 20 },
    dayCellDisabled: { opacity: 0.3 },
    dayText: { fontSize: 14, color: theme.textPrimary, fontWeight: '500' },
    dayTextSelected: { color: '#fff', fontWeight: '700' },
    dayTextDisabled: { color: theme.textMuted },
    dataDot: { position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 2.5 },
    dataDotSelected: { backgroundColor: '#fff' },

    dateCard: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
    dateHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    dateTitle: { flex: 1, fontSize: 14, color: theme.textPrimary, fontWeight: '600' },
    todayBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
    todayText: { fontSize: 11, fontWeight: '600' },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryDivider: { width: 1, height: 40, backgroundColor: theme.border },
    summaryValue: { fontSize: 20, fontWeight: '800', color: theme.textPrimary, marginTop: 4 },
    summaryLabel: { fontSize: 11, color: theme.textMuted },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: spacing.sm },

    emptyCard: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center' },
    emptyText: { fontSize: 14, color: theme.textMuted, marginTop: spacing.sm },

    workoutsList: { gap: spacing.sm },
    workoutCard: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.md },
    workoutHeader: { flexDirection: 'row', alignItems: 'center' },
    workoutIcon: { fontSize: 32, marginRight: spacing.sm },
    workoutInfo: { flex: 1 },
    workoutType: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, textTransform: 'capitalize' },
    workoutTime: { fontSize: 13, color: theme.textMuted },

    exercisesList: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: theme.border },
    exerciseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
    exerciseDot: { width: 6, height: 6, borderRadius: 3, marginRight: spacing.sm },
    exerciseName: { flex: 1, fontSize: 14, color: theme.textPrimary },
    exerciseSets: { fontSize: 12, color: theme.textMuted },

    cardioSection: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardioLabel: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
    cardioInfo: { fontSize: 13, color: theme.textMuted },

    exercisesTitle: { fontSize: 13, fontWeight: '700', color: theme.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
    setsDetail: { backgroundColor: theme.cardBackgroundLight || theme.background, borderRadius: borderRadius.sm, padding: spacing.sm, marginTop: spacing.sm },
    setsDetailTitle: { fontSize: 13, fontWeight: '700', color: theme.brandWorkout, marginBottom: spacing.xs },
    setRow: { fontSize: 12, color: theme.textSecondary, paddingVertical: 2 },
});

export default WorkoutHistoryScreen;
