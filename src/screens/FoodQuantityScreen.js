import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const SERVING_TYPES = [
    { key: 'spoon', label: 'Spoon', emoji: '🥄' },
    { key: 'bowl', label: 'Bowl', emoji: '🥣' },
    { key: 'katori', label: 'Katori', emoji: '🍲' },
    { key: 'plate', label: 'Plate', emoji: '🍽️' },
    { key: 'piece', label: 'Piece', emoji: '🍕' },
    { key: 'cup', label: 'Cup', emoji: '☕' },
    { key: 'glass', label: 'Glass', emoji: '🥛' },
    { key: 'gm', label: 'Grams', emoji: '⚖️' },
];

const MEAL_TYPES = [
    { id: 'breakfast', label: 'Breakfast', icon: 'sunny-outline', color: '#FF9500' },
    { id: 'morningSnack', label: 'Morning Snack', icon: 'cafe-outline', color: '#FF9500' },
    { id: 'lunch', label: 'Lunch', icon: 'restaurant-outline', color: '#34C759' },
    { id: 'eveningSnack', label: 'Evening Snack', icon: 'ice-cream-outline', color: '#34C759' },
    { id: 'dinner', label: 'Dinner', icon: 'moon-outline', color: '#5856D6' },
];

const FoodQuantityScreen = ({ navigation, route }) => {
    const { addMeal, updateMealForDate, getTodayDate } = useUser();
    const { theme, isDarkMode } = useTheme();

    const {
        food,
        mealType: initialMealType = 'lunch',
        isEditing = false,
        mealId,
        initialQuantity,
        initialServingType,
        dateString = getTodayDate()
    } = route.params || {};

    const [servingType, setServingType] = useState(initialServingType || food?.defaultServing || 'bowl');
    const [quantity, setQuantity] = useState(initialQuantity || 1);
    const [selectedMealType, setSelectedMealType] = useState(initialMealType);

    // AI Editing Support
    const [isEditingAI, setIsEditingAI] = useState(false);
    const [editedAIFood, setEditedAIFood] = useState(food?.isAI ? { ...food } : null);

    // Deriving Baseline Metrics for scaling
    const baseMetrics = useMemo(() => {
        if (!food) return null;

        // If it's already a 'proper' food with per100g metrics, use them
        if (food.caloriesPer100g !== undefined) {
            return {
                caloriesPer100g: food.caloriesPer100g,
                proteinPer100g: food.proteinPer100g,
                carbsPer100g: food.carbsPer100g,
                fatsPer100g: food.fatsPer100g,
                fiberPer100g: food.fiberPer100g || 0,
            };
        }

        // Otherwise (AI or legacy log), derive them from current values
        const currentQty = parseFloat(food.quantity) || 1;
        let grams = 100; // Default fallback

        // Attempt to convert current quantity string (e.g., "500g" or "1 bowl") to grams
        if (food.quantity?.toLowerCase().includes('g')) {
            grams = currentQty;
        } else {
            // It's a unit (bowl, piece, etc). Try to find grams for it
            const unit = food.quantity?.replace(/[0-9.]/g, '').trim().toLowerCase();
            const servingGrams = food.servingSizes?.[unit] || SERVING_TYPES.find(s => s.label.toLowerCase() === unit)?.key || 100;
            grams = (typeof servingGrams === 'number' ? servingGrams : 100) * currentQty;
        }

        const toPer100g = 100 / (grams || 100);
        return {
            caloriesPer100g: (food.calories || 0) * toPer100g,
            proteinPer100g: (food.protein || 0) * toPer100g,
            carbsPer100g: (food.carbs || 0) * toPer100g,
            fatsPer100g: (food.fats || 0) * toPer100g,
            fiberPer100g: (food.fiber || 0) * toPer100g,
        };
    }, [food]);

    const calculateNutrition = () => {
        if (!food || !baseMetrics) return { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, grams: 0 };

        // For non-editing AI results, we still scale based on the selection
        let grams;
        if (servingType === 'gm') {
            grams = parseFloat(quantity) || 0;
        } else {
            const servingGrams = food.servingSizes?.[servingType] || 100;
            grams = servingGrams * (parseFloat(quantity) || 0);
        }

        const multiplier = grams / 100;

        // If user is manually editing AI fields, use their direct values
        if (food.isAI && isEditingAI && editedAIFood) {
            return {
                grams: Math.round(grams),
                calories: editedAIFood.calories,
                protein: editedAIFood.protein,
                carbs: editedAIFood.carbs,
                fats: editedAIFood.fats,
                fiber: editedAIFood.fiber || 0,
                quantity: editedAIFood.quantity
            };
        }

        return {
            grams: Math.round(grams),
            calories: Math.round(baseMetrics.caloriesPer100g * multiplier),
            protein: Math.round(baseMetrics.proteinPer100g * multiplier * 10) / 10,
            carbs: Math.round(baseMetrics.carbsPer100g * multiplier * 10) / 10,
            fats: Math.round(baseMetrics.fatsPer100g * multiplier * 10) / 10,
            fiber: Math.round(baseMetrics.fiberPer100g * multiplier * 10) / 10,
        };
    };

    const nutrition = calculateNutrition();

    const handleSave = () => {
        const servingLabel = food.isAI && isEditingAI ? editedAIFood.quantity : (
            servingType === 'gm'
                ? `${quantity}g`
                : `${quantity} ${SERVING_TYPES.find(s => s.key === servingType)?.label || servingType}`
        );

        const mealData = {
            type: selectedMealType,
            foodId: food._id || food.foodId,
            foodName: (food.isAI && isEditingAI) ? editedAIFood?.name : (food.name || food.foodName),
            quantity: servingLabel,
            foods: [{
                id: food._id || food.foodId || Date.now(),
                name: (food.isAI && isEditingAI) ? editedAIFood?.name : (food.name || food.foodName),
                quantity: servingLabel,
                calories: nutrition.calories,
                protein: nutrition.protein,
                carbs: nutrition.carbs,
                fats: nutrition.fats,
                fiber: nutrition.fiber,
                // Persist the baseline for future accurate editing
                caloriesPer100g: baseMetrics.caloriesPer100g,
                proteinPer100g: baseMetrics.proteinPer100g,
                carbsPer100g: baseMetrics.carbsPer100g,
                fatsPer100g: baseMetrics.fatsPer100g,
                fiberPer100g: baseMetrics.fiberPer100g,
                servingSizes: food.servingSizes,
            }],
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fats: nutrition.fats,
            fiber: nutrition.fiber,
        };

        if (isEditing && mealId) {
            updateMealForDate(dateString, mealId, mealData);
        } else {
            addMeal(mealData);
        }

        navigation.goBack();
        if (!isEditing) {
            navigation.goBack(); // Second pop to exit search as well
        }
    };

    const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{food?.name || food?.foodName}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Nutrition Summary */}
                <View style={styles.nutritionCard}>
                    <View style={styles.nutritionHeader}>
                        <Text style={[styles.nutritionTitle, { color: theme.brandNutrition }]}>
                            {food?.isAI ? (editedAIFood?.quantity || food.quantity) : `${nutrition.grams}g`} = {nutrition.calories} kcal
                        </Text>
                        {food?.isAI && (
                            <View style={styles.aiBadge}>
                                <Ionicons name="sparkles" size={12} color="#fff" />
                                <Text style={styles.aiBadgeText}>Sweat-X AI Identified</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.macrosRow}>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: theme.protein || '#FF3B30' }]}>{nutrition.protein}g</Text>
                            <Text style={styles.macroLabel}>Protein</Text>
                        </View>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: theme.carbs || '#FF9500' }]}>{nutrition.carbs}g</Text>
                            <Text style={styles.macroLabel}>Carbs</Text>
                        </View>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: theme.fats || '#34C759' }]}>{nutrition.fats}g</Text>
                            <Text style={styles.macroLabel}>Fats</Text>
                        </View>
                    </View>
                </View>

                {food?.isAI && (
                    <TouchableOpacity
                        style={[styles.editAIBtn, {
                            borderColor: theme.brandNutrition,
                            backgroundColor: isEditingAI ? theme.brandNutrition : 'transparent'
                        }]}
                        onPress={() => setIsEditingAI(!isEditingAI)}
                    >
                        <Ionicons name={isEditingAI ? "checkmark-circle" : "create-outline"} size={18} color={isEditingAI ? "#fff" : theme.brandNutrition} />
                        <Text style={[styles.editAIBtnText, { color: isEditingAI ? "#fff" : theme.brandNutrition }]}>
                            {isEditingAI ? "Done Editing" : "Edit AI Recognition"}
                        </Text>
                    </TouchableOpacity>
                )}

                {food?.isAI && isEditingAI ? (
                    <View style={styles.editAIContainer}>
                        <Text style={styles.inputLabel}>Food Name</Text>
                        <TextInput
                            style={styles.editInput}
                            value={editedAIFood?.name}
                            onChangeText={(text) => setEditedAIFood({ ...editedAIFood, name: text })}
                        />
                        <Text style={styles.inputLabel}>Portion / Serving</Text>
                        <TextInput
                            style={styles.editInput}
                            value={editedAIFood?.quantity}
                            onChangeText={(text) => setEditedAIFood({ ...editedAIFood, quantity: text })}
                        />
                        <View style={styles.editMacrosGrid}>
                            <View style={styles.editMacroInput}>
                                <Text style={styles.editMacroLabel}>Calories</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={String(editedAIFood?.calories)}
                                    onChangeText={(text) => setEditedAIFood({ ...editedAIFood, calories: parseInt(text) || 0 })}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.editMacroInput}>
                                <Text style={styles.editMacroLabel}>Protein</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={String(editedAIFood?.protein)}
                                    onChangeText={(text) => setEditedAIFood({ ...editedAIFood, protein: parseFloat(text) || 0 })}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.editMacroInput}>
                                <Text style={styles.editMacroLabel}>Carbs</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={String(editedAIFood?.carbs)}
                                    onChangeText={(text) => setEditedAIFood({ ...editedAIFood, carbs: parseFloat(text) || 0 })}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.editMacroInput}>
                                <Text style={styles.editMacroLabel}>Fats</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={String(editedAIFood?.fats)}
                                    onChangeText={(text) => setEditedAIFood({ ...editedAIFood, fats: parseFloat(text) || 0 })}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>
                ) : !food?.isAI && (
                    <>
                        <Text style={styles.inputLabel}>Serving Size</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servingScroll}>
                            {SERVING_TYPES.map((serving) => (
                                <TouchableOpacity
                                    key={serving.key}
                                    style={[styles.servingBtn, servingType === serving.key && { backgroundColor: theme.primary }]}
                                    onPress={() => setServingType(serving.key)}
                                >
                                    <Text style={styles.servingEmoji}>{serving.emoji}</Text>
                                    <Text style={[styles.servingLabel, servingType === serving.key && { color: '#fff', fontWeight: '600' }]}>
                                        {serving.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.inputLabel}>Quantity</Text>
                        <View style={styles.quantityRow}>
                            <TouchableOpacity
                                style={styles.quantityBtn}
                                onPress={() => {
                                    const step = servingType === 'gm' ? 10 : (quantity <= 5 ? 0.25 : 0.5);
                                    setQuantity(Math.max(servingType === 'gm' ? 10 : 0.25, quantity - step));
                                }}
                            >
                                <Ionicons name="remove" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                            <View style={styles.quantityDisplay}>
                                <Text style={[styles.quantityValue, { color: theme.primary }]}>
                                    {servingType === 'gm' ? `${quantity}g` : quantity}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.quantityBtn}
                                onPress={() => {
                                    const step = servingType === 'gm' ? 10 : (quantity < 5 ? 0.25 : 0.5);
                                    setQuantity(quantity + step);
                                }}
                            >
                                <Ionicons name="add" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.quickQuantities}>
                            {(servingType === 'gm' ? [50, 100, 150, 200, 250, 500] : [0.5, 1, 1.5, 2, 3, 5]).map((q) => (
                                <TouchableOpacity
                                    key={q}
                                    style={[styles.quickQtyBtn, quantity === q && { backgroundColor: theme.primary }]}
                                    onPress={() => setQuantity(q)}
                                >
                                    <Text style={[styles.quickQtyText, { color: quantity === q ? '#fff' : theme.textSecondary, fontWeight: quantity === q ? '600' : '400' }]}>
                                        {servingType === 'gm' ? `${q}g` : q}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                <Text style={styles.inputLabel}>Add to Meal</Text>
                <View style={styles.mealTypesGrid}>
                    {MEAL_TYPES.map((meal) => (
                        <TouchableOpacity
                            key={meal.id}
                            style={[styles.mealTypeBtn, selectedMealType === meal.id && { borderColor: meal.color, borderWidth: 2 }]}
                            onPress={() => setSelectedMealType(meal.id)}
                        >
                            <Ionicons name={meal.icon} size={20} color={selectedMealType === meal.id ? meal.color : theme.textMuted} />
                            <Text style={[styles.mealTypeLabel, selectedMealType === meal.id && { color: meal.color }]}>
                                {meal.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                >
                    <Ionicons name={isEditing ? "checkmark-circle" : "add-circle"} size={22} color="#fff" />
                    <Text style={styles.saveBtnText}>
                        {isEditing ? "Update Log" : "Add Food"} ({nutrition.calories} kcal)
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme, isDarkMode) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    headerTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: spacing.sm },
    scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

    nutritionCard: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    nutritionHeader: { alignItems: 'center', marginBottom: spacing.md },
    nutritionTitle: { fontSize: 24, fontWeight: '800' },
    aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#5856D6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 8, gap: 4 },
    aiBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
    macrosRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
    macroItem: { alignItems: 'center' },
    macroValue: { fontSize: 20, fontWeight: '700' },
    macroLabel: { fontSize: 11, color: theme.textMuted, marginTop: 2, fontWeight: '500' },

    editAIBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: spacing.lg, gap: 8 },
    editAIBtnText: { fontSize: 14, fontWeight: '600' },

    editAIContainer: { backgroundColor: theme.cardBackground, borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    editInput: { backgroundColor: isDarkMode ? '#222' : '#f5f5f5', borderRadius: 10, padding: 12, color: theme.textPrimary, fontSize: 14, marginBottom: spacing.md, borderWidth: 1, borderColor: theme.border },
    editMacrosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    editMacroInput: { width: '47%' },
    editMacroLabel: { fontSize: 10, color: theme.textMuted, marginBottom: 4, marginLeft: 4 },
    macroInput: { backgroundColor: isDarkMode ? '#222' : '#f5f5f5', borderRadius: 10, padding: 10, color: theme.textPrimary, fontSize: 14, borderWidth: 1, borderColor: theme.border },

    inputLabel: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    servingScroll: { marginBottom: 20 },
    servingBtn: { alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: 14, padding: 12, marginRight: spacing.sm, minWidth: 80, borderWidth: 1, borderColor: theme.border },
    servingEmoji: { fontSize: 24 },
    servingLabel: { fontSize: 11, color: theme.textMuted, marginTop: 4 },

    quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30, marginBottom: spacing.lg },
    quantityBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    quantityDisplay: { backgroundColor: theme.cardBackground, borderRadius: 16, paddingHorizontal: 30, paddingVertical: 15, borderWidth: 1, borderColor: theme.border },
    quantityValue: { fontSize: 32, fontWeight: '800' },

    quickQuantities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 },
    quickQtyBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border },
    quickQtyText: { fontSize: 13 },

    mealTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
    mealTypeBtn: { flex: 1, minWidth: '30%', flexDirection: 'column', alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: 14, padding: 12, gap: 6, borderWidth: 1, borderColor: theme.border },
    mealTypeLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted },

    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, padding: 18, gap: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});

export default FoodQuantityScreen;
