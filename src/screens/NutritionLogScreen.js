import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const NutritionLogScreen = ({ navigation }) => {
    const {
        getNutritionForDate,
        getDatesWithNutritionData,
        deleteMealForDate,
        updateMealForDate,
        getTodayDate,
        checkAndResetDaily,
    } = useUser();
    const { theme, isDarkMode } = useTheme();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [datesWithData, setDatesWithData] = useState([]);
    const [editingMeal, setEditingMeal] = useState(null);
    const [editCalories, setEditCalories] = useState('');
    const [editName, setEditName] = useState('');

    useEffect(() => {
        checkAndResetDaily();
        setDatesWithData(getDatesWithNutritionData());
    }, []);

    const nutritionData = getNutritionForDate(selectedDate);
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

    const handleDeleteMeal = (mealId) => {
        Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    deleteMealForDate(selectedDate, mealId);
                    setDatesWithData(getDatesWithNutritionData());
                }
            },
        ]);
    };

    const handleEditMeal = (meal) => {
        setEditingMeal(meal);
        setEditName(meal.foodName || meal.name || meal.description || '');
        setEditCalories(String(meal.calories || 0));
    };

    const handleSaveEdit = () => {
        if (editingMeal) {
            updateMealForDate(selectedDate, editingMeal.id, {
                foodName: editName,
                calories: parseInt(editCalories) || 0,
            });
            setEditingMeal(null);
            setDatesWithData(getDatesWithNutritionData());
        }
    };

    const formatDisplayDate = (dateStr) => {
        const date = new Date(dateStr);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const getMealIcon = (type) => {
        switch (type) {
            case 'breakfast': return '🍳';
            case 'morningSnack': return '🥤';
            case 'lunch': return '🍛';
            case 'eveningSnack': return '🍎';
            case 'dinner': return '🍲';
            default: return '🍽️';
        }
    };

    const getMealLabel = (type) => {
        switch (type) {
            case 'breakfast': return 'Breakfast';
            case 'morningSnack': return 'Morning Snack';
            case 'lunch': return 'Lunch';
            case 'eveningSnack': return 'Evening Snack';
            case 'dinner': return 'Dinner';
            default: return 'Meal';
        }
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="theme.textPrimary" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>NUTRITION LOG</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Month Navigation */}
                <View style={styles.monthNav}>
                    <TouchableOpacity style={styles.monthBtn} onPress={prevMonth}>
                        <Ionicons name="chevron-back" size={24} color="theme.textPrimary" />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>
                        {monthNames[currentMonth.getMonth()].toUpperCase()} {currentMonth.getFullYear()}
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
                                                isSelected(day) && styles.dataDotSelected
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
                        <Ionicons name="calendar-outline" size={20} color={theme.brandNutrition} />
                        <Text style={styles.dateTitle}>{formatDisplayDate(selectedDate).toUpperCase()}</Text>
                        {nutritionData.isToday && (
                            <View style={[styles.todayBadge, { backgroundColor: theme.brandNutrition + '20' }]}>
                                <Text style={[styles.todayText, { color: theme.brandNutrition }]}>Today</Text>
                            </View>
                        )}
                    </View>

                    {/* Summary */}
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Ionicons name="flame-outline" size={18} color={'#F59E0B'} />
                            <Text style={styles.summaryValue}>{nutritionData.totalCalories}</Text>
                            <Text style={styles.summaryLabel}>KCAL IN</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Ionicons name="water" size={18} color={theme.info} />
                            <Text style={styles.summaryValue}>{nutritionData.waterIntake || 0}</Text>
                            <Text style={styles.summaryLabel}>glasses water</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Ionicons name="fitness-outline" size={18} color={theme.brandNutrition} />
                            <Text style={styles.summaryValue}>{nutritionData.caloriesBurned || 0}</Text>
                            <Text style={styles.summaryLabel}>KCAL OUT</Text>
                        </View>
                    </View>
                </View>

                {/* Meals List */}
                <Text style={styles.sectionTitle}>
                    MEALS ({nutritionData.meals.length})
                </Text>

                {nutritionData.meals.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="nutrition-outline" size={48} color={theme.textMuted} />
                        <Text style={styles.emptyText}>No meals logged for this day</Text>
                    </View>
                ) : (
                    <View style={styles.mealsList}>
                        {nutritionData.meals.map((meal, index) => (
                            <View key={meal.id || index} style={styles.mealCard}>
                                <View style={styles.mealLeft}>
                                    <Text style={styles.mealIcon}>{getMealIcon(meal.type)}</Text>
                                    <View style={styles.mealInfo}>
                                        <Text style={styles.mealType}>{getMealLabel(meal.type)}</Text>
                                        <Text style={styles.mealName} numberOfLines={1}>
                                            {meal.foodName ?? meal.name ?? meal.description ?? 'Unknown Food'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.mealRight}>
                                    <Text style={styles.mealCalories}>{meal.calories} KCAL</Text>
                                    <View style={styles.mealActions}>
                                        <TouchableOpacity
                                            style={styles.actionBtn}
                                            onPress={() => handleEditMeal(meal)}
                                        >
                                            <Ionicons name="pencil" size={16} color={theme.brandNutrition} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.actionBtn}
                                            onPress={() => handleDeleteMeal(meal.id)}
                                        >
                                            <Ionicons name="trash" size={16} color={theme.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Edit Meal Modal */}
            <Modal visible={!!editingMeal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Meal</Text>
                            <TouchableOpacity onPress={() => setEditingMeal(null)}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Meal Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter meal name"
                            placeholderTextColor={theme.textMuted}
                        />

                        <Text style={styles.inputLabel}>Calories</Text>
                        <TextInput
                            style={styles.input}
                            value={editCalories}
                            onChangeText={setEditCalories}
                            keyboardType="numeric"
                            placeholder="Enter calories"
                            placeholderTextColor={theme.textMuted}
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        </TouchableOpacity>
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
    scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    monthBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    monthBtnDisabled: { opacity: 0.3 },
    monthTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, letterSpacing: 1 },

    calendar: { backgroundColor: theme.cardBackground, borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    dayHeaders: { flexDirection: 'row', marginBottom: spacing.sm },
    dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '500', color: theme.textSecondary, letterSpacing: 1 },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    dayCellSelected: { backgroundColor: theme.brandNutrition, borderRadius: 10 },
    dayCellToday: { borderWidth: 1.5, borderColor: theme.brandNutrition, borderRadius: 10 },
    dayCellDisabled: { opacity: 0.1 },
    dayText: { fontSize: 14, color: theme.textPrimary, fontWeight: '500' },
    dayTextSelected: { color: '#fff', fontWeight: '600' },
    dayTextDisabled: { color: theme.textSecondary },
    dataDot: { position: 'absolute', bottom: 6, width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.brandNutrition },
    dataDotSelected: { backgroundColor: '#fff' },

    dateCard: { backgroundColor: theme.cardBackground, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    dateHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    dateTitle: { flex: 1, fontSize: 12, color: theme.textPrimary, fontWeight: '600', letterSpacing: 1 },
    todayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    todayText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryDivider: { width: 1, height: 36, backgroundColor: theme.border },
    summaryValue: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, marginTop: 4 },
    summaryLabel: { fontSize: 9, color: theme.textSecondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },

    sectionTitle: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: spacing.sm, letterSpacing: 1.5, textTransform: 'uppercase' },

    emptyCard: { backgroundColor: theme.cardBackground, borderRadius: 16, padding: spacing.xl, alignItems: 'center', borderStyle: 'dotted', borderWidth: 1, borderColor: theme.border },
    emptyText: { fontSize: 14, color: theme.textSecondary, marginTop: spacing.sm, fontWeight: '400' },

    mealsList: { gap: spacing.sm },
    mealCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.cardBackground, borderRadius: 14, padding: spacing.md, borderWidth: 1, borderColor: theme.border },
    mealLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    mealIcon: { fontSize: 24, marginRight: spacing.sm },
    mealInfo: { flex: 1 },
    mealType: { fontSize: 10, color: theme.brandNutrition, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    mealName: { fontSize: 15, fontWeight: '500', color: theme.textPrimary, marginTop: 2 },
    mealRight: { alignItems: 'flex-end' },
    mealCalories: { fontSize: 16, fontWeight: '700', color: theme.brandNutrition },
    mealActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    actionBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#222222', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#151515', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40, borderWidth: 1, borderColor: theme.border },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
    modalTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, letterSpacing: 1 },
    inputLabel: { fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: theme.cardBackground, borderRadius: 12, padding: spacing.md, color: theme.textPrimary, fontSize: 16, marginBottom: spacing.md, borderWidth: 1, borderColor: theme.border },
    saveBtn: { backgroundColor: theme.brandNutrition, borderRadius: 12, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
    saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff', letterSpacing: 2 },
});

export default NutritionLogScreen;
