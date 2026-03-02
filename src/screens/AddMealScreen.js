import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '../constants/colors';
import PrimaryButton from '../components/PrimaryButton';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 20;

const QUANTITY_OPTIONS = ['100g', '1 bowl', '1 katori', '1 spoon', '1 piece', '1 plate'];

const AddMealScreen = ({ navigation }) => {
    const { userData, addMeal, deleteMealForDate, getTodayDate, updateMealForDate } = useUser();
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

    // Grouping logic
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

    const [currentInput, setCurrentInput] = useState({ breakfast: '', morningSnack: '', lunch: '', eveningSnack: '', dinner: '' });
    const [selectedQuantity, setSelectedQuantity] = useState({ breakfast: '100g', morningSnack: '100g', lunch: '100g', eveningSnack: '100g', dinner: '100g' });
    const [expandedSection, setExpandedSection] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingFood, setEditingFood] = useState(null);
    const [editQuantity, setEditQuantity] = useState('');

    const toggleSection = (sectionId) => {
        setExpandedSection(expandedSection === sectionId ? null : sectionId);
    };

    const addQuickFood = async (mealId) => {
        const foodName = currentInput[mealId].trim();
        if (!foodName) return;
        setIsCalculating(true);
        const quantity = selectedQuantity[mealId];

        // Basic calorie estimation
        const calories = Math.round(50 + Math.random() * 100);

        addMeal({
            type: mealId,
            foodId: `quick_${Date.now()}`,
            foodName: foodName,
            quantity: quantity,
            foods: [{ id: Date.now(), name: foodName, quantity, calories, protein: 0, carbs: 0, fats: 0 }],
            calories: calories,
            protein: 0,
            carbs: 0,
            fats: 0
        });

        setCurrentInput(prev => ({ ...prev, [mealId]: '' }));
        setIsCalculating(false);
    };

    const handleRemoveFood = (food) => {
        deleteMealForDate(getTodayDate(), food.logId);
    };

    const handleEditFood = (food) => {
        setEditingFood(food);
        setEditQuantity(food.quantity || '100g');
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        if (!editingFood) return;

        // Find the original meal to update
        const originalMeal = userData.meals.find(m => m.id === editingFood.logId);
        if (!originalMeal) return;

        // Update the food quantity in the meal
        const updatedFoods = originalMeal.foods.map(f =>
            f.id === editingFood.id ? { ...f, quantity: editQuantity } : f
        );

        // Recalculate total calories based on new quantity (simplified)
        // For now, keep the same calories - a more complex implementation would recalculate
        const updatedMeal = {
            ...originalMeal,
            foods: updatedFoods,
        };

        updateMealForDate(getTodayDate(), editingFood.logId, updatedMeal);
        setShowEditModal(false);
        setEditingFood(null);
    };


    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            <View style={styles.content}>
                {/* Custom Header */}
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

                    {/* Premium Summary Card */}
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
                                    <Ionicons
                                        name={isExpanded ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={theme.textMuted}
                                    />
                                </TouchableOpacity>

                                {/* Mini Progress Line */}
                                {!isExpanded && (
                                    <View style={styles.inlineProgress}>
                                        <View style={[styles.inlineProgressFill, { width: `${mealProgress * 100}%`, backgroundColor: section.color }]} />
                                    </View>
                                )}

                                {isExpanded && (
                                    <View style={styles.expandedContent}>
                                        {/* Dynamic Logged Items */}
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

            {/* Floating Done Button */}
            <View style={styles.footer}>
                <PrimaryButton
                    title="Done Logging"
                    onPress={() => navigation.goBack()}
                    style={styles.doneBtn}
                />
            </View>

            {/* Edit Quantity Modal */}
            <Modal visible={showEditModal} animationType="fade" transparent={true} onRequestClose={() => setShowEditModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Quantity</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.editFoodName}>{editingFood?.name}</Text>

                        <Text style={styles.editLabel}>Select Quantity</Text>
                        <View style={styles.quantityOptions}>
                            {QUANTITY_OPTIONS.map((qty) => (
                                <TouchableOpacity
                                    key={qty}
                                    style={[styles.quantityBtn, editQuantity === qty && styles.quantityBtnActive]}
                                    onPress={() => setEditQuantity(qty)}
                                >
                                    <Text style={[styles.quantityBtnText, editQuantity === qty && styles.quantityBtnTextActive]}>{qty}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.customQuantityInput}
                            placeholder="Or enter custom quantity..."
                            placeholderTextColor={theme.textMuted}
                            value={editQuantity}
                            onChangeText={setEditQuantity}
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

const createStyles = (theme, isDarkMode) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SCREEN_PADDING,
        paddingBottom: spacing.md,
        gap: spacing.md,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5 },
    headerDate: { fontSize: 13, color: theme.textMuted, fontWeight: '500' },
    headerAction: { width: 44 },
    scrollView: { flex: 1 },
    scrollPadding: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 120 },

    summaryCard: {
        backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    summaryTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    summaryVal: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
    summaryLabel: { fontSize: 12, color: theme.textMuted, fontWeight: '600', marginTop: 2 },
    progressContainer: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBg: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 10,
        borderColor: theme.border + '40',
    },
    progressFill: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 10,
        borderColor: theme.brandNutrition,
        borderTopColor: 'transparent',
        borderLeftColor: 'transparent', // CSS Trick for circle progress in React Native is limited, but this acts as a visual placeholder
        transform: [{ rotate: '45deg' }],
    },
    progressCenter: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressPercentage: { fontSize: 18, fontWeight: '800', color: theme.textPrimary },
    summaryBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        gap: 6,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.border + '40',
    },
    summarySubtitle: { fontSize: 11, color: theme.textMuted, fontWeight: '500' },

    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    sectionAction: { fontSize: 13, color: theme.brandNutrition, fontWeight: '600' },

    mealCard: {
        backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        borderRadius: 20,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    mealCardActive: {
        borderColor: theme.brandNutrition + '20',
        shadowColor: theme.brandNutrition,
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mealMainInfo: { flex: 1 },
    mealLabel: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
    mealSub: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
    mealValueBox: { alignItems: 'flex-end', marginRight: 12 },
    mealValue: { fontSize: 16, fontWeight: '800' },
    mealTarget: { fontSize: 11, color: theme.textMuted },

    inlineProgress: {
        height: 3,
        backgroundColor: theme.border + '20',
        width: '100%',
    },
    inlineProgressFill: {
        height: '100%',
    },

    expandedContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 8,
    },
    emptyItems: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    emptyText: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },

    loggedItems: {
        marginBottom: 16,
    },
    loggedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 10,
    },
    loggedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.brandNutrition },
    loggedName: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
    loggedMeta: { fontSize: 11, color: theme.textMuted },
    loggedCals: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, marginRight: 8 },
    removeBtn: { padding: 4 },

    searchLink: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border + '40',
    },
    searchIcon: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    searchLinkText: { flex: 1, fontSize: 13, fontWeight: '700' },

    quickAddRow: {
        flexDirection: 'row',
        gap: 10,
    },
    quickInputWrap: {
        flex: 1,
        backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    quickInput: { fontSize: 13, color: theme.textPrimary, height: 48 },
    quickAddBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SCREEN_PADDING,
        paddingBottom: 40,
        backgroundColor: 'transparent',
    },
    doneBtn: {
        shadowColor: theme.brandNutrition,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },

    // Edit button style
    editBtn: {
        padding: 6,
        marginRight: 4,
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: theme.cardBackground,
        borderRadius: borderRadius.lg,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.textPrimary,
    },
    editFoodName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.brandNutrition,
        marginBottom: 16,
    },
    editLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.textMuted,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    quantityOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    quantityBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: borderRadius.sm,
        backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    quantityBtnActive: {
        backgroundColor: theme.primary + '20',
        borderColor: theme.primary,
    },
    quantityBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    quantityBtnTextActive: {
        color: theme.primary,
        fontWeight: '700',
    },
    customQuantityInput: {
        height: 50,
        backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7',
        borderRadius: borderRadius.md,
        paddingHorizontal: 16,
        fontSize: 14,
        color: theme.textPrimary,
        marginBottom: 20,
    },
    saveBtn: {
        backgroundColor: theme.primary,
        height: 52,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
    },
});

export default AddMealScreen;
