import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const AIFoodReviewScreen = ({ navigation, route }) => {
    const { addMeal, getTodayDate } = useUser();
    const { theme, isDarkMode } = useTheme();

    const {
        aiFoods = [],
        mealType = 'lunch',
    } = route.params || {};

    const [foods, setFoods] = useState(
        aiFoods.map((f, i) => ({
            _id: 'ai_' + Date.now() + '_' + i,
            name: f.name,
            isAI: true,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fats: f.fats,
            fiber: f.fiber || 0,
            quantity: f.quantity,
            isVegetarian: f.isVegetarian
        }))
    );

    useEffect(() => {
        if (route.params?.aiFoods) {
            setFoods(route.params.aiFoods.map((f, i) => ({
                _id: f._id || f.id || 'ai_' + Date.now() + '_' + i,
                name: f.name || f.foodName,
                isAI: f.isAI ?? (f.cuisine === 'Saved Meal' || f.caloriesPer100g ? false : true),
                calories: f.calories,
                protein: f.protein,
                carbs: f.carbs,
                fats: f.fats,
                fiber: f.fiber || 0,
                quantity: f.quantity,
                isVegetarian: f.isVegetarian || false,
                caloriesPer100g: f.caloriesPer100g || (f.foods && f.foods[0]?.caloriesPer100g),
                proteinPer100g: f.proteinPer100g || (f.foods && f.foods[0]?.proteinPer100g),
                carbsPer100g: f.carbsPer100g || (f.foods && f.foods[0]?.carbsPer100g),
                fatsPer100g: f.fatsPer100g || (f.foods && f.foods[0]?.fatsPer100g),
                fiberPer100g: f.fiberPer100g || (f.foods && f.foods[0]?.fiberPer100g),
                servingSizes: f.servingSizes || (f.foods && f.foods[0]?.servingSizes),
            })));
        }
    }, [route.params?.aiFoods]);

    const handleEditFood = (foodIndex) => {
        const food = foods[foodIndex];
        // Navigate to search screen with replace parameters
        navigation.push('FoodSearch', {
            replaceAIFoodIndex: foodIndex,
            initialQuery: food.name,
            mealType,
            aiFoods: foods
        });
    };

    const handleRemoveFood = (foodIndex) => {
        const newFoods = [...foods];
        newFoods.splice(foodIndex, 1);
        setFoods(newFoods);
        if (newFoods.length === 0) {
            navigation.goBack();
        }
    };

    const handleSaveAll = () => {
        const dateString = getTodayDate();
        
        foods.forEach(food => {
            const mealData = {
                type: mealType,
                foodId: food._id,
                foodName: food.name,
                quantity: food.quantity || "1 serving",
                foods: [{
                    id: food._id,
                    name: food.name,
                    quantity: food.quantity || "1 serving",
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fats: food.fats,
                    fiber: food.fiber,
                    caloriesPer100g: food.caloriesPer100g || food.calories, // use DB metrics if available
                    proteinPer100g: food.proteinPer100g || food.protein,
                    carbsPer100g: food.carbsPer100g || food.carbs,
                    fatsPer100g: food.fatsPer100g || food.fats,
                    fiberPer100g: food.fiberPer100g || food.fiber,
                    servingSizes: food.servingSizes,
                }],
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fats: food.fats,
                fiber: food.fiber,
            };
            addMeal(mealData);
        });

        // Navigate explicitly back to the main app dashboard
        navigation.navigate('MainApp', { screen: 'Dashboard' });
    };

    const handleAddAnother = () => {
        navigation.push('FoodSearch', {
            addAIFood: true,
            mealType,
            aiFoods: foods
        });
    };

    const totalCalories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
    const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review AI Meal</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>AI Detected {foods.length} items</Text>
                    <Text style={styles.summaryCalories}>{totalCalories} kcal Total</Text>
                </View>

                {foods.map((food, index) => (
                    <View key={food._id} style={styles.foodCard}>
                        <View style={styles.foodInfo}>
                            <Text style={styles.foodName}>{food.name}</Text>
                            <Text style={styles.foodMeta}>{food.quantity} • {food.calories} kcal</Text>
                            <View style={styles.macrosRow}>
                                <Text style={[styles.macro, { color: theme.protein || '#FF3B30' }]}>P: {food.protein}g</Text>
                                <Text style={[styles.macro, { color: theme.carbs || '#FF9500' }]}>C: {food.carbs}g</Text>
                                <Text style={[styles.macro, { color: theme.fats || '#34C759' }]}>F: {food.fats}g</Text>
                            </View>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => handleEditFood(index)} style={styles.actionBtn}>
                                <Ionicons name="pencil" size={20} color={theme.textPrimary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveFood(index)} style={styles.actionBtn}>
                                <Ionicons name="trash-outline" size={20} color={theme.error || '#FF3B30'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.primary, marginBottom: spacing.sm }]}
                    onPress={handleAddAnother}
                >
                    <Ionicons name="add" size={22} color={theme.primary} />
                    <Text style={[styles.saveBtnText, { color: theme.primary }]}>Add Another Food</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSaveAll}
                >
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.saveBtnText}>Log {foods.length} items</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    scroll: { padding: spacing.lg },
    
    summaryCard: { backgroundColor: theme.cardBackground, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    summaryTitle: { fontSize: 16, color: theme.textSecondary, marginBottom: 4 },
    summaryCalories: { fontSize: 28, fontWeight: '800', color: theme.brandNutrition },

    foodCard: { flexDirection: 'row', backgroundColor: theme.cardBackground, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: theme.border },
    foodInfo: { flex: 1, justifyContent: 'center' },
    foodName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
    foodMeta: { fontSize: 14, color: theme.textSecondary, marginBottom: 8 },
    macrosRow: { flexDirection: 'row', gap: 12 },
    macro: { fontSize: 12, fontWeight: '600' },
    
    actions: { justifyContent: 'center', alignItems: 'center', paddingLeft: spacing.md, borderLeftWidth: 1, borderLeftColor: theme.border, gap: 16 },
    actionBtn: { padding: 4 },

    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, padding: 18, gap: 10, marginTop: spacing.md },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});

export default AIFoodReviewScreen;
