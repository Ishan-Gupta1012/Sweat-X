import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

import { API_URL } from '../services/api';

const SERVING_TYPES = [
    { key: 'spoon', label: 'Spoon', emoji: '🥄' },
    { key: 'bowl', label: 'Bowl', emoji: '🥣' },
    { key: 'katori', label: 'Katori', emoji: '🍲' },
    { key: 'plate', label: 'Plate', emoji: '🍽️' },
    { key: 'piece', label: 'Piece', emoji: '🍕' },
    { key: 'gm', label: 'Grams', emoji: '⚖️' },
];

const CreateMealScreen = ({ navigation }) => {
    const { userData, updateProfile } = useUser();
    const { theme, isDarkMode } = useTheme();

    const [mealName, setMealName] = useState('');
    const [selectedFoods, setSelectedFoods] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showAddFood, setShowAddFood] = useState(false);
    const [currentFood, setCurrentFood] = useState(null);
    const [servingType, setServingType] = useState('bowl');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                searchFoods(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const searchFoods = async (query) => {
        setIsSearching(true);
        try {
            const response = await fetch(`${API_URL}/foods/search?q=${encodeURIComponent(query)}&limit=15`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.log('Error searching:', error);
        }
        setIsSearching(false);
    };

    const handleSelectFood = (food) => {
        setCurrentFood(food);
        setServingType(food.defaultServing || 'bowl');
        setQuantity(1);
        setShowAddFood(true);
    };

    const calculateFoodNutrition = (food) => {
        let grams;
        if (servingType === 'gm') {
            grams = quantity;
        } else {
            const servingGrams = food.servingSizes?.[servingType] || 100;
            grams = servingGrams * quantity;
        }
        const multiplier = grams / 100;
        return {
            grams: Math.round(grams),
            calories: Math.round(food.caloriesPer100g * multiplier),
            protein: Math.round(food.proteinPer100g * multiplier * 10) / 10,
            carbs: Math.round(food.carbsPer100g * multiplier * 10) / 10,
            fats: Math.round(food.fatsPer100g * multiplier * 10) / 10,
        };
    };

    const addFoodToMeal = () => {
        if (!currentFood) return;

        const nutrition = calculateFoodNutrition(currentFood);
        const servingLabel = servingType === 'gm'
            ? `${quantity}g`
            : `${quantity} ${SERVING_TYPES.find(s => s.key === servingType)?.label || servingType}`;

        const foodItem = {
            id: currentFood._id + '-' + Date.now(),
            foodId: currentFood._id,
            name: currentFood.name,
            servingLabel,
            ...nutrition,
        };

        setSelectedFoods([...selectedFoods, foodItem]);
        setShowAddFood(false);
        setCurrentFood(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeFood = (foodId) => {
        setSelectedFoods(selectedFoods.filter(f => f.id !== foodId));
    };

    const getTotals = () => {
        return selectedFoods.reduce((acc, food) => ({
            calories: acc.calories + food.calories,
            protein: acc.protein + food.protein,
            carbs: acc.carbs + food.carbs,
            fats: acc.fats + food.fats,
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    };

    const handleSaveMeal = async () => {
        if (!mealName.trim() || selectedFoods.length === 0) return;

        const totals = getTotals();
        const savedMeal = {
            id: Date.now().toString(),
            name: mealName.trim(),
            foods: selectedFoods,
            totalCalories: totals.calories,
            totalProtein: totals.protein,
            totalCarbs: totals.carbs,
            totalFats: totals.fats,
            createdAt: new Date().toISOString(),
        };

        const savedMeals = userData.savedMeals || [];
        await updateProfile({ savedMeals: [...savedMeals, savedMeal] });

        navigation.goBack();
    };

    const totals = getTotals();
    const nutrition = currentFood ? calculateFoodNutrition(currentFood) : null;
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Meal</Text>
                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.brandNutrition }, (!mealName.trim() || selectedFoods.length === 0) && styles.saveBtnDisabled]}
                    onPress={handleSaveMeal}
                    disabled={!mealName.trim() || selectedFoods.length === 0}
                >
                    <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Meal Name */}
                <Text style={styles.label}>Meal Name</Text>
                <TextInput
                    style={styles.nameInput}
                    placeholder="e.g., My Breakfast Combo"
                    placeholderTextColor={theme.textMuted}
                    value={mealName}
                    onChangeText={setMealName}
                />

                {/* Add Foods */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.label}>Foods ({selectedFoods.length})</Text>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search to add food..."
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Search Results */}
                {isSearching ? (
                    <ActivityIndicator style={styles.loading} color={theme.brandNutrition} />
                ) : searchResults.length > 0 && (
                    <View style={styles.searchResults}>
                        {searchResults.map((food) => (
                            <TouchableOpacity
                                key={food._id}
                                style={styles.searchResultItem}
                                onPress={() => handleSelectFood(food)}
                            >
                                <Text style={styles.searchResultName}>{food.name}</Text>
                                <Text style={styles.searchResultCal}>{food.caloriesPer100g} kcal</Text>
                                <Ionicons name="add-circle" size={22} color={theme.brandNutrition} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Selected Foods List */}
                {selectedFoods.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="restaurant-outline" size={48} color={theme.textMuted} />
                        <Text style={styles.emptyText}>No foods added yet</Text>
                        <Text style={styles.emptySubtext}>Search and add foods to your meal</Text>
                    </View>
                ) : (
                    <View style={styles.foodList}>
                        {selectedFoods.map((food) => (
                            <View key={food.id} style={styles.foodCard}>
                                <View style={styles.foodInfo}>
                                    <Text style={styles.foodName}>{food.name}</Text>
                                    <Text style={styles.foodServing}>{food.servingLabel}</Text>
                                </View>
                                <View style={styles.foodNutrition}>
                                    <Text style={[styles.foodCalories, { color: theme.brandNutrition }]}>{food.calories} kcal</Text>
                                    <Text style={styles.foodMacros}>P:{food.protein}g C:{food.carbs}g F:{food.fats}g</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeFood(food.id)}>
                                    <Ionicons name="close-circle" size={24} color={theme.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Totals */}
                {selectedFoods.length > 0 && (
                    <View style={styles.totalsCard}>
                        <Text style={styles.totalsTitle}>Meal Totals</Text>
                        <View style={styles.totalsGrid}>
                            <View style={styles.totalItem}>
                                <Text style={[styles.totalValue, { color: theme.brandNutrition }]}>{totals.calories}</Text>
                                <Text style={styles.totalLabel}>kcal</Text>
                            </View>
                            <View style={styles.totalItem}>
                                <Text style={[styles.totalValue, { color: theme.protein || '#FF3B30' }]}>{Math.round(totals.protein)}g</Text>
                                <Text style={styles.totalLabel}>Protein</Text>
                            </View>
                            <View style={styles.totalItem}>
                                <Text style={[styles.totalValue, { color: theme.carbs || '#FF9500' }]}>{Math.round(totals.carbs)}g</Text>
                                <Text style={styles.totalLabel}>Carbs</Text>
                            </View>
                            <View style={styles.totalItem}>
                                <Text style={[styles.totalValue, { color: theme.fats || '#34C759' }]}>{Math.round(totals.fats)}g</Text>
                                <Text style={styles.totalLabel}>Fats</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Add Food Modal */}
            <Modal visible={showAddFood} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowAddFood(false)}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>{currentFood?.name}</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        {currentFood && nutrition && (
                            <>
                                <View style={styles.nutritionPreview}>
                                    <Text style={[styles.nutritionCalories, { color: theme.brandNutrition }]}>{nutrition.calories} kcal</Text>
                                    <View style={styles.macrosRow}>
                                        <Text style={[styles.macro, { color: theme.protein || '#FF3B30' }]}>P:{nutrition.protein}g</Text>
                                        <Text style={[styles.macro, { color: theme.carbs || '#FF9500' }]}>C:{nutrition.carbs}g</Text>
                                        <Text style={[styles.macro, { color: theme.fats || '#34C759' }]}>F:{nutrition.fats}g</Text>
                                    </View>
                                </View>

                                <Text style={styles.inputLabel}>Serving</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servingScroll}>
                                    {SERVING_TYPES.map((s) => (
                                        <TouchableOpacity
                                            key={s.key}
                                            style={[styles.servingBtn, servingType === s.key && { backgroundColor: theme.brandNutrition }]}
                                            onPress={() => setServingType(s.key)}
                                        >
                                            <Text style={styles.servingEmoji}>{s.emoji}</Text>
                                            <Text style={[styles.servingLabel, servingType === s.key && { color: '#fff' }]}>{s.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={styles.inputLabel}>Quantity</Text>
                                <View style={styles.quantityRow}>
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                                    >
                                        <Ionicons name="remove" size={24} color={theme.textPrimary} />
                                    </TouchableOpacity>
                                    <Text style={[styles.qtyValue, { color: theme.brandNutrition }]}>{servingType === 'gm' ? `${quantity}g` : quantity}</Text>
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => setQuantity(quantity + 0.5)}
                                    >
                                        <Ionicons name="add" size={24} color={theme.textPrimary} />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.brandNutrition }]} onPress={addFoodToMeal}>
                                    <Ionicons name="add-circle" size={22} color="#fff" />
                                    <Text style={styles.addBtnText}>Add to Meal</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
    saveBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    scrollView: { flex: 1, paddingHorizontal: spacing.lg },

    label: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginBottom: spacing.sm },
    nameInput: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16, color: theme.textPrimary, marginBottom: spacing.lg },

    sectionHeader: { marginBottom: spacing.sm },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm, marginBottom: spacing.sm },
    searchInput: { flex: 1, fontSize: 15, color: theme.textPrimary },
    loading: { padding: spacing.md },

    searchResults: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, marginBottom: spacing.md, overflow: 'hidden' },
    searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
    searchResultName: { flex: 1, fontSize: 14, color: theme.textPrimary },
    searchResultCal: { fontSize: 12, color: theme.textMuted, marginRight: spacing.sm },

    emptyState: { alignItems: 'center', padding: spacing.xl },
    emptyText: { fontSize: 16, fontWeight: '600', color: theme.textMuted, marginTop: spacing.sm },
    emptySubtext: { fontSize: 13, color: theme.textMuted },

    foodList: { gap: spacing.sm },
    foodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, padding: spacing.md },
    foodInfo: { flex: 1 },
    foodName: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
    foodServing: { fontSize: 12, color: theme.textMuted },
    foodNutrition: { alignItems: 'flex-end', marginRight: spacing.sm },
    foodCalories: { fontSize: 14, fontWeight: '700' },
    foodMacros: { fontSize: 10, color: theme.textMuted },

    totalsCard: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.lg },
    totalsTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: spacing.md, textAlign: 'center' },
    totalsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    totalItem: { alignItems: 'center' },
    totalValue: { fontSize: 20, fontWeight: '800' },
    totalLabel: { fontSize: 11, color: theme.textMuted },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
    modalTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },

    nutritionPreview: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
    nutritionCalories: { fontSize: 28, fontWeight: '800' },
    macrosRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
    macro: { fontSize: 14, fontWeight: '600' },

    inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textMuted, marginBottom: spacing.xs },
    servingScroll: { marginBottom: spacing.lg },
    servingBtn: { alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, padding: spacing.sm, marginRight: spacing.sm, minWidth: 65 },
    servingEmoji: { fontSize: 22 },
    servingLabel: { fontSize: 10, color: theme.textMuted },

    quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl, marginBottom: spacing.lg },
    qtyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center' },
    qtyValue: { fontSize: 24, fontWeight: '800' },

    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: borderRadius.lg, paddingVertical: spacing.md },
    addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default CreateMealScreen;
