import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 20;

const AddMealScreen = ({ navigation }) => {
    const { userData, addMeal, deleteMealForDate, getTodayDate } = useUser();
    const { theme, isDarkMode } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

    const totalGoal = userData.calorieGoal || 2000;
    const consumed = userData.dailyCalories || 0;
    const progress = Math.min(consumed / totalGoal, 1);

    const mealSections = [
        { id: 'breakfast', label: 'Breakfast', icon: 'sunny', target: Math.round(totalGoal * 0.25), color: '#FF9500', sub: 'Start your day right' },
        { id: 'morningSnack', label: 'Morning Snack', icon: 'cafe', target: Math.round(totalGoal * 0.125), color: '#FFCC00', sub: 'Light energy boost' },
        { id: 'lunch', label: 'Lunch', icon: 'restaurant', target: Math.round(totalGoal * 0.25), color: '#34C759', sub: 'The midday fuel' },
        { id: 'eveningSnack', label: 'Evening Snack', icon: 'ice-cream', target: Math.round(totalGoal * 0.125), color: '#AF52DE', sub: 'Stay active till dinner' },
        { id: 'dinner', label: 'Dinner', icon: 'moon', target: Math.round(totalGoal * 0.25), color: '#5856D6', sub: 'Light and healthy' },
    ];

    const { groupedMeals, sectorCalories } = useMemo(() => {
        const categories = { breakfast: [], morningSnack: [], lunch: [], eveningSnack: [], dinner: [] };
        const calories = { breakfast: 0, morningSnack: 0, lunch: 0, eveningSnack: 0, dinner: 0 };

        userData.meals.forEach(meal => {
            if (categories[meal.type]) {
                const foods = meal.foods || [];
                categories[meal.type].push(...foods.map(f => ({ ...f, logId: meal.id, mealType: meal.type })));
                calories[meal.type] += meal.calories || 0;
            }
        });

        return { groupedMeals: categories, sectorCalories: calories };
    }, [userData.meals]);

    const [expandedSection, setExpandedSection] = useState(null);

    const toggleSection = (sectionId) => {
        setExpandedSection(expandedSection === sectionId ? null : sectionId);
    };

    const handleRemoveFood = (food) => {
        deleteMealForDate(getTodayDate(), food.logId);
    };

    const handleEditFood = (food) => {
        // Prioritize stored per-100g metrics to ensure accurate scaling
        const hasBaseMetrics = food.caloriesPer100g !== undefined;

        navigation.navigate('FoodQuantity', {
            food: {
                ...food,
                // If we have stored base metrics, use them directly
                caloriesPer100g: hasBaseMetrics ? food.caloriesPer100g : (food.caloriesPer100g || (food.calories / (parseFloat(food.quantity) || 100) * 100)),
                proteinPer100g: hasBaseMetrics ? food.proteinPer100g : (food.proteinPer100g || (food.protein / (parseFloat(food.quantity) || 100) * 100)),
                carbsPer100g: hasBaseMetrics ? food.carbsPer100g : (food.carbsPer100g || (food.carbs / (parseFloat(food.quantity) || 100) * 100)),
                fatsPer100g: hasBaseMetrics ? food.fatsPer100g : (food.fatsPer100g || (food.fats / (parseFloat(food.quantity) || 100) * 100)),
            },
            isEditing: true,
            mealId: food.logId,
            initialQuantity: parseFloat(food.quantity) || 1,
            initialServingType: food.quantity?.toLowerCase().includes('g') ? 'gm' : (food.quantity?.split(' ')[1]?.toLowerCase() || 'bowl'),
            mealType: food.mealType || 'lunch'
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Daily Intake</Text>
                        <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.navigate('FoodSearch', { autoTriggerCamera: true })}
                    >
                        <Ionicons name="camera" size={22} color={theme.brandNutrition} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryTop}>
                            <View>
                                <Text style={styles.summaryVal}>{consumed}</Text>
                                <Text style={styles.summaryLabel}>Eaten</Text>
                            </View>
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBg} />
                                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                                <View style={styles.progressCenter}>
                                    <Text style={styles.progressPercentage}>{Math.round(progress * 100)}%</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.summaryVal}>{Math.max(0, totalGoal - consumed)}</Text>
                                <Text style={styles.summaryLabel}>Left</Text>
                            </View>
                        </View>
                        <View style={styles.summaryBottom}>
                            <Ionicons name="flash" size={12} color={theme.brandNutrition} />
                            <Text style={styles.summarySubtitle}>Goal: {totalGoal} kcal • Powered by Sweat-X AI</Text>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Meal Categories</Text>
                        <Text style={styles.sectionAction}>View Logs</Text>
                    </View>

                    {mealSections.map((section) => {
                        const mealConsumed = sectorCalories[section.id];
                        const mealProgress = Math.min(mealConsumed / section.target, 1);
                        const isExpanded = expandedSection === section.id;
                        const items = groupedMeals[section.id];

                        return (
                            <View key={section.id} style={[styles.mealCard, isExpanded && styles.mealCardActive]}>
                                <TouchableOpacity
                                    style={styles.mealHeader}
                                    onPress={() => toggleSection(section.id)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: section.color + '15' }]}>
                                        <Ionicons name={section.icon} size={22} color={section.color} />
                                    </View>
                                    <View style={styles.mealMainInfo}>
                                        <Text style={styles.mealLabel}>{section.label}</Text>
                                        <Text style={styles.mealSub}>{section.sub}</Text>
                                    </View>
                                    <View style={styles.mealValueBox}>
                                        <Text style={[styles.mealValue, { color: section.color }]}>{mealConsumed}</Text>
                                        <Text style={styles.mealTarget}>/ {section.target}</Text>
                                    </View>
                                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textMuted} />
                                </TouchableOpacity>

                                {!isExpanded && (
                                    <View style={styles.inlineProgress}>
                                        <View style={[styles.inlineProgressFill, { width: `${mealProgress * 100}%`, backgroundColor: section.color }]} />
                                    </View>
                                )}

                                {isExpanded && (
                                    <View style={styles.expandedContent}>
                                        {items.length > 0 ? (
                                            <View style={styles.loggedItems}>
                                                {items.map((food, idx) => (
                                                    <View key={idx} style={styles.loggedItem}>
                                                        <View style={styles.loggedDot} />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.loggedName}>{food.foodName ?? food.name ?? 'Unknown Food'}</Text>
                                                            <Text style={styles.loggedMeta}>{food.quantity}</Text>
                                                        </View>
                                                        <Text style={styles.loggedCals}>{food.calories} kcal</Text>
                                                        <TouchableOpacity onPress={() => handleEditFood(food)} style={styles.editBtn}>
                                                            <Ionicons name="pencil" size={16} color={theme.brandNutrition} />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => handleRemoveFood(food)} style={styles.removeBtn}>
                                                            <Ionicons name="close-circle" size={18} color={theme.error} />
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <View style={styles.emptyItems}>
                                                <Ionicons name="restaurant-outline" size={24} color={theme.textMuted + '40'} />
                                                <Text style={styles.emptyText}>Nothing logged yet</Text>
                                            </View>
                                        )}

                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity
                                                style={[styles.searchLink, { flex: 1, marginRight: 8 }]}
                                                onPress={() => navigation.navigate('FoodSearch', { mealType: section.id })}
                                            >
                                                <Ionicons name="search" size={14} color={theme.brandNutrition} style={{ marginRight: 8 }} />
                                                <Text style={[styles.searchLinkText, { color: theme.brandNutrition }]}>Search</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.searchLink, { flex: 1, borderColor: theme.brandNutrition + '50' }]}
                                                onPress={() => navigation.navigate('FoodSearch', { mealType: section.id, autoTriggerCamera: true })}
                                            >
                                                <Ionicons name="camera" size={14} color={theme.brandNutrition} style={{ marginRight: 8 }} />
                                                <View>
                                                    <Text style={[styles.searchLinkText, { color: theme.brandNutrition }]}>Scan</Text>
                                                    <Text style={{ fontSize: 8, color: theme.brandNutrition, opacity: 0.7 }}>Max limit: 80 MB</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.footer}>
                <PrimaryButton
                    title="Done Logging"
                    onPress={() => navigation.goBack()}
                    style={styles.doneBtn}
                />
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme, isDarkMode) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.md, gap: spacing.md },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5 },
    headerDate: { fontSize: 13, color: theme.textMuted, fontWeight: '500' },
    scrollView: { flex: 1 },
    scrollPadding: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 120 },
    summaryCard: { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF', borderRadius: 24, padding: 24, marginBottom: spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
    summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    summaryVal: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
    summaryLabel: { fontSize: 12, color: theme.textMuted, fontWeight: '600', marginTop: 2 },
    progressContainer: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
    progressBg: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 10, borderColor: theme.border + '40' },
    progressFill: { position: 'absolute', height: 10, borderRadius: 5, backgroundColor: theme.brandNutrition, bottom: 0, left: 0 }, // Simplified for rewrite
    progressCenter: { width: 70, height: 70, borderRadius: 35, backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
    progressPercentage: { fontSize: 18, fontWeight: '800', color: theme.textPrimary },
    summaryBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 6, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border + '40' },
    summarySubtitle: { fontSize: 11, color: theme.textMuted, fontWeight: '500' },
    actionButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    sectionAction: { fontSize: 13, color: theme.brandNutrition, fontWeight: '600' },
    mealCard: { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF', borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
    mealCardActive: { borderColor: theme.brandNutrition + '20', shadowColor: theme.brandNutrition, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    mealHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    mealMainInfo: { flex: 1 },
    mealLabel: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
    mealSub: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
    mealValueBox: { alignItems: 'flex-end', marginRight: 12 },
    mealValue: { fontSize: 16, fontWeight: '800' },
    mealTarget: { fontSize: 11, color: theme.textMuted },
    inlineProgress: { height: 3, backgroundColor: theme.border + '20', width: '100%' },
    inlineProgressFill: { height: '100%' },
    expandedContent: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 8 },
    emptyItems: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 8 },
    emptyText: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
    loggedItems: { marginBottom: 16 },
    loggedItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
    loggedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.brandNutrition },
    loggedName: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
    loggedMeta: { fontSize: 11, color: theme.textMuted },
    loggedCals: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, marginRight: 8 },
    removeBtn: { padding: 4 },
    editBtn: { padding: 6, marginRight: 4 },
    searchLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border + '40' },
    searchLinkText: { flex: 1, fontSize: 13, fontWeight: '700' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SCREEN_PADDING, paddingBottom: 40, backgroundColor: 'transparent' },
    doneBtn: { shadowColor: theme.brandNutrition, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
});

export default AddMealScreen;
