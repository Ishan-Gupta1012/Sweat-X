import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Modal, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

const FoodSearchScreen = ({ navigation, route }) => {
    const { addMeal } = useUser();
    const { theme, isDarkMode } = useTheme();
    const initialMealType = route.params?.mealType || 'lunch';

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [popularFoods, setPopularFoods] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);
    const [showFoodDetail, setShowFoodDetail] = useState(false);

    const [servingType, setServingType] = useState('bowl');
    const [quantity, setQuantity] = useState(1);
    const [selectedMealType, setSelectedMealType] = useState(initialMealType);
    const [showQuantityPicker, setShowQuantityPicker] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isEditingAI, setIsEditingAI] = useState(false);
    const [editedAIFood, setEditedAIFood] = useState(null);

    useEffect(() => {
        fetchPopularFoods();
    }, []);

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

    // Handle Auto Camera Trigger
    const cameraTriggered = useRef(false);
    useEffect(() => {
        if (route.params?.autoTriggerCamera && !cameraTriggered.current) {
            cameraTriggered.current = true;
            handleCameraPress();
        }
    }, [route.params?.autoTriggerCamera]);

    const fetchPopularFoods = async () => {
        try {
            const response = await fetch(`${API_URL}/foods/popular?limit=10`);
            if (response.ok) {
                const data = await response.json();
                setPopularFoods(data);
            }
        } catch (error) {
            console.log('Error fetching popular foods:', error);
        }
    };

    const searchFoods = async (query) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/foods/search?q=${encodeURIComponent(query)}&limit=20`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.log('Error searching foods:', error);
        }
        setIsLoading(false);
    };

    const handleFoodSelect = (food) => {
        setSelectedFood(food);
        setServingType(food.defaultServing || 'bowl');
        setQuantity(1);
        setShowFoodDetail(true);
    };

    const calculateNutrition = () => {
        if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, grams: 0 };

        let grams;
        if (servingType === 'gm') {
            grams = quantity;
        } else {
            const servingGrams = selectedFood.servingSizes?.[servingType] || 100;
            grams = servingGrams * quantity;
        }

        const multiplier = grams / 100;
        return {
            grams: Math.round(grams),
            calories: Math.round(selectedFood.caloriesPer100g * multiplier),
            protein: Math.round(selectedFood.proteinPer100g * multiplier * 10) / 10,
            carbs: Math.round(selectedFood.carbsPer100g * multiplier * 10) / 10,
            fats: Math.round(selectedFood.fatsPer100g * multiplier * 10) / 10,
            fiber: Math.round((selectedFood.fiberPer100g || 0) * multiplier * 10) / 10,
        };
    };

    const handleCameraPress = async () => {
        Alert.alert(
            'Scan Food',
            'Choose a source to identify your meal',
            [
                {
                    text: 'Take Photo',
                    onPress: () => openCamera(),
                },
                {
                    text: 'Choose from Gallery',
                    onPress: () => openGallery(),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    const openCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Camera Permission Required',
                    'TrueFit needs camera access to scan and analyze your food. Please enable camera permissions in your device settings.'
                );
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.2,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].base64) {
                analyzeImage(result.assets[0].base64);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Could not access camera.');
        }
    };

    const openGallery = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Gallery Permission Required',
                    'TrueFit needs gallery access to analyze your food photos. Please enable permissions in your device settings.'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.2,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].base64) {
                analyzeImage(result.assets[0].base64);
            }
        } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert('Error', 'Could not access photo library.');
        }
    };

    const analyzeImage = async (base64) => {
        setIsAnalyzing(true);
        try {
            const response = await fetch(`${API_URL}/foods/analyze-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64 }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server error (${response.status}): ${text.substring(0, 500)}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Invalid response format (expected JSON, got ${contentType}): ${text.substring(0, 500)}`);
            }

            const data = await response.json();
            if (data.success && data.analysis) {
                setAiAnalysis(data.analysis);
                const aiFood = {
                    _id: 'ai_' + Date.now(),
                    name: data.analysis.name,
                    isAI: true,
                    calories: data.analysis.calories,
                    protein: data.analysis.protein,
                    carbs: data.analysis.carbs,
                    fats: data.analysis.fats,
                    fiber: data.analysis.fiber || 0,
                    quantity: data.analysis.quantity,
                    isVegetarian: data.analysis.isVegetarian
                };
                setSelectedFood(aiFood);
                setEditedAIFood(aiFood); // Initialize edited values
                setIsEditingAI(false); // Start in view mode
                setShowFoodDetail(true);
            } else {
                Alert.alert(
                    'Food Recognition Failed',
                    data.error || 'Could not identify the food in the image. Please try taking a clearer photo or add food manually.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('AI analysis error:', error);
            Alert.alert(
                'Analysis Error',
                'Failed to analyze the image. Please check your internet connection and try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAddFood = () => {
        const nutr = selectedFood.isAI ? {
            calories: editedAIFood?.calories || selectedFood.calories,
            protein: editedAIFood?.protein || selectedFood.protein,
            carbs: editedAIFood?.carbs || selectedFood.carbs,
            fats: editedAIFood?.fats || selectedFood.fats,
            fiber: editedAIFood?.fiber || selectedFood.fiber || 0
        } : calculateNutrition();

        const servingLabel = selectedFood.isAI ? (editedAIFood?.quantity || selectedFood.quantity) : (
            servingType === 'gm'
                ? `${quantity}g`
                : `${quantity} ${SERVING_TYPES.find(s => s.key === servingType)?.label || servingType}`
        );

        addMeal({
            type: selectedMealType,
            foodId: selectedFood._id,
            foodName: editedAIFood?.name || selectedFood.name,
            quantity: servingLabel,
            foods: [{
                id: selectedFood._id,
                name: editedAIFood?.name || selectedFood.name,
                quantity: servingLabel,
                calories: nutr.calories,
                protein: nutr.protein,
                carbs: nutr.carbs,
                fats: nutr.fats,
                fiber: nutr.fiber,
            }],
            calories: nutr.calories,
            protein: nutr.protein,
            carbs: nutr.carbs,
            fats: nutr.fats,
            fiber: nutr.fiber,
        });

        setShowFoodDetail(false);
        setSelectedFood(null);
        setAiAnalysis(null);
        setIsEditingAI(false);
        setEditedAIFood(null);
        navigation.goBack();
    };

    const nutrition = calculateNutrition();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const FoodItem = ({ food }) => (
        <TouchableOpacity style={styles.foodItem} onPress={() => handleFoodSelect(food)}>
            <View style={styles.foodIcon}>
                <Text style={styles.foodEmoji}>{food.isVegetarian ? '🥬' : '🍖'}</Text>
            </View>
            <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{food.name}</Text>
                {food.nameHindi && <Text style={styles.foodNameHindi}>{food.nameHindi}</Text>}
                <Text style={styles.foodMeta}>{food.cuisine} • {food.caloriesPer100g} kcal/100g</Text>
            </View>
            <View style={styles.foodCalories}>
                <Text style={styles.calorieNumber}>{food.caloriesPer100g}</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Food</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Camera Option */}
                {Platform.OS !== 'web' && (
                    <TouchableOpacity style={styles.cameraCard} onPress={handleCameraPress}>
                        <View style={[styles.cameraBox, { borderColor: theme.brandNutrition + '30' }]}>
                            <Ionicons name="camera" size={48} color={theme.brandNutrition} />
                            <Text style={styles.cameraText}>Scan Food</Text>
                            <Text style={styles.cameraSubtext}>Take a photo to identify food</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for food..."
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Create Meal Button */}
                <TouchableOpacity
                    style={styles.createMealBtn}
                    onPress={() => navigation.navigate('CreateMeal')}
                >
                    <Ionicons name="add-circle" size={24} color={theme.brandNutrition} />
                    <Text style={styles.createMealText}>Create Meal</Text>
                    <Text style={styles.createMealSubtext}>Combine multiple foods</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </TouchableOpacity>

                {/* Search Results or Popular Foods */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.brandNutrition} />
                    </View>
                ) : searchQuery.length >= 2 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Search Results ({searchResults.length})
                        </Text>
                        {searchResults.length === 0 ? (
                            <Text style={styles.noResults}>No foods found for "{searchQuery}"</Text>
                        ) : (
                            searchResults.map((food) => (
                                <FoodItem key={food._id} food={food} />
                            ))
                        )}
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Popular Foods</Text>
                        {popularFoods.map((food) => (
                            <FoodItem key={food._id} food={food} />
                        ))}
                    </View>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Food Detail Modal */}
            <Modal visible={showFoodDetail} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowFoodDetail(false)}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>{selectedFood?.name}</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        {selectedFood && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Nutrition Summary */}
                                <View style={styles.nutritionCard}>
                                    <View style={styles.nutritionHeader}>
                                        <Text style={[styles.nutritionTitle, { color: theme.brandNutrition }]}>
                                            {selectedFood.isAI ? selectedFood.quantity : `${nutrition.grams}g`} = {selectedFood.isAI ? selectedFood.calories : nutrition.calories} kcal
                                        </Text>
                                        {selectedFood.isAI && (
                                            <View style={styles.aiBadge}>
                                                <Ionicons name="sparkles" size={12} color="#fff" />
                                                <Text style={styles.aiBadgeText}>Verified by Sweat-X AI</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.macrosRow}>
                                        <View style={styles.macroItem}>
                                            <Text style={[styles.macroValue, { color: theme.protein || '#FF3B30' }]}>
                                                {selectedFood.isAI ? selectedFood.protein : nutrition.protein}g
                                            </Text>
                                            <Text style={styles.macroLabel}>Protein</Text>
                                        </View>
                                        <View style={styles.macroItem}>
                                            <Text style={[styles.macroValue, { color: theme.carbs || '#FF9500' }]}>
                                                {selectedFood.isAI ? selectedFood.carbs : nutrition.carbs}g
                                            </Text>
                                            <Text style={styles.macroLabel}>Carbs</Text>
                                        </View>
                                        <View style={styles.macroItem}>
                                            <Text style={[styles.macroValue, { color: theme.fats || '#34C759' }]}>
                                                {selectedFood.isAI ? selectedFood.fats : nutrition.fats}g
                                            </Text>
                                            <Text style={styles.macroLabel}>Fats</Text>
                                        </View>
                                    </View>
                                </View>

                                {selectedFood.servingDescription && (
                                    <View style={[styles.standardServing, { backgroundColor: theme.brandNutrition + '10', borderColor: theme.brandNutrition + '30' }]}>
                                        <Ionicons name="information-circle" size={18} color={theme.brandNutrition} />
                                        <Text style={[styles.standardServingText, { color: theme.textPrimary }]}>
                                            Standard Serving: <Text style={{ fontWeight: '700' }}>{selectedFood.servingDescription}</Text>
                                        </Text>
                                    </View>
                                )}

                                {/* Edit Button for AI Foods */}
                                {selectedFood.isAI && (
                                    <TouchableOpacity
                                        style={[styles.editAIBtn, {
                                            backgroundColor: isEditingAI ? theme.brandNutrition : theme.cardBackground,
                                            borderColor: theme.brandNutrition
                                        }]}
                                        onPress={() => setIsEditingAI(!isEditingAI)}
                                    >
                                        <Ionicons
                                            name={isEditingAI ? "checkmark-circle" : "create-outline"}
                                            size={18}
                                            color={isEditingAI ? "#fff" : theme.brandNutrition}
                                        />
                                        <Text style={[styles.editAIBtnText, {
                                            color: isEditingAI ? "#fff" : theme.brandNutrition
                                        }]}>
                                            {isEditingAI ? "Done Editing" : "Edit Details"}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Editable AI Food Details */}
                                {selectedFood.isAI && isEditingAI && (
                                    <>
                                        <Text style={styles.inputLabel}>Food Name</Text>
                                        <TextInput
                                            style={[styles.editInput, {
                                                backgroundColor: theme.cardBackground,
                                                color: theme.textPrimary,
                                                borderColor: theme.brandNutrition + '30'
                                            }]}
                                            value={editedAIFood?.name || selectedFood.name}
                                            onChangeText={(text) => setEditedAIFood({ ...editedAIFood, name: text })}
                                            placeholder="Food name"
                                            placeholderTextColor={theme.textMuted}
                                        />

                                        <Text style={styles.inputLabel}>Quantity / Serving</Text>
                                        <TextInput
                                            style={[styles.editInput, {
                                                backgroundColor: theme.cardBackground,
                                                color: theme.textPrimary,
                                                borderColor: theme.brandNutrition + '30'
                                            }]}
                                            value={editedAIFood?.quantity || selectedFood.quantity}
                                            onChangeText={(text) => setEditedAIFood({ ...editedAIFood, quantity: text })}
                                            placeholder="e.g., 1 bowl, 150g"
                                            placeholderTextColor={theme.textMuted}
                                        />

                                        <Text style={styles.inputLabel}>Nutrition Values</Text>
                                        <View style={styles.editMacrosGrid}>
                                            <View style={styles.editMacroInput}>
                                                <Text style={styles.editMacroLabel}>Calories (kcal)</Text>
                                                <TextInput
                                                    style={[styles.macroInput, {
                                                        backgroundColor: theme.cardBackground,
                                                        color: theme.brandNutrition,
                                                        borderColor: theme.brandNutrition + '30'
                                                    }]}
                                                    value={String(editedAIFood?.calories || selectedFood.calories)}
                                                    onChangeText={(text) => setEditedAIFood({ ...editedAIFood, calories: parseInt(text) || 0 })}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor={theme.textMuted}
                                                />
                                            </View>
                                            <View style={styles.editMacroInput}>
                                                <Text style={styles.editMacroLabel}>Protein (g)</Text>
                                                <TextInput
                                                    style={[styles.macroInput, {
                                                        backgroundColor: theme.cardBackground,
                                                        color: theme.protein,
                                                        borderColor: theme.protein + '30'
                                                    }]}
                                                    value={String(editedAIFood?.protein || selectedFood.protein)}
                                                    onChangeText={(text) => setEditedAIFood({ ...editedAIFood, protein: parseInt(text) || 0 })}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor={theme.textMuted}
                                                />
                                            </View>
                                            <View style={styles.editMacroInput}>
                                                <Text style={styles.editMacroLabel}>Carbs (g)</Text>
                                                <TextInput
                                                    style={[styles.macroInput, {
                                                        backgroundColor: theme.cardBackground,
                                                        color: theme.carbs,
                                                        borderColor: theme.carbs + '30'
                                                    }]}
                                                    value={String(editedAIFood?.carbs || selectedFood.carbs)}
                                                    onChangeText={(text) => setEditedAIFood({ ...editedAIFood, carbs: parseInt(text) || 0 })}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor={theme.textMuted}
                                                />
                                            </View>
                                            <View style={styles.editMacroInput}>
                                                <Text style={styles.editMacroLabel}>Fats (g)</Text>
                                                <TextInput
                                                    style={[styles.macroInput, {
                                                        backgroundColor: theme.cardBackground,
                                                        color: theme.fats,
                                                        borderColor: theme.fats + '30'
                                                    }]}
                                                    value={String(editedAIFood?.fats || selectedFood.fats)}
                                                    onChangeText={(text) => setEditedAIFood({ ...editedAIFood, fats: parseInt(text) || 0 })}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor={theme.textMuted}
                                                />
                                            </View>
                                            <View style={styles.editMacroInput}>
                                                <Text style={styles.editMacroLabel}>Fiber (g)</Text>
                                                <TextInput
                                                    style={[styles.macroInput, {
                                                        backgroundColor: theme.cardBackground,
                                                        color: theme.fiber,
                                                        borderColor: theme.fiber + '30'
                                                    }]}
                                                    value={String(editedAIFood?.fiber || selectedFood.fiber || 0)}
                                                    onChangeText={(text) => setEditedAIFood({ ...editedAIFood, fiber: parseInt(text) || 0 })}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor={theme.textMuted}
                                                />
                                            </View>
                                        </View>
                                    </>
                                )}

                                {!selectedFood.isAI && (
                                    <>
                                        {/* Serving Type */}
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

                                        {/* Quantity */}
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

                                        {/* Quick Quantity Options */}
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

                                {/* Meal Type */}
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

                                {/* Add Button */}
                                <TouchableOpacity style={[styles.addFoodBtn, { backgroundColor: theme.primary }]} onPress={handleAddFood}>
                                    <Ionicons name="add-circle" size={22} color="#fff" />
                                    <Text style={styles.addFoodBtnText}>Add Food ({selectedFood.isAI ? selectedFood.calories : nutrition.calories} kcal)</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* AI Analyzing Overlay */}
            <Modal visible={isAnalyzing} transparent animationType="fade">
                <View style={styles.analysisOverlay}>
                    <View style={styles.analysisBox}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.analysisText, { color: theme.textPrimary }]}>Recognizing Food...</Text>
                        <Text style={styles.analysisSub}>Sweat-X AI is analyzing your meal</Text>
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
    scrollView: { flex: 1, paddingHorizontal: spacing.lg },

    cameraCard: { marginBottom: spacing.md },
    cameraBox: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed' },
    cameraText: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginTop: spacing.sm },
    cameraSubtext: { fontSize: 12, color: theme.textMuted },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md, gap: spacing.sm },
    searchInput: { flex: 1, fontSize: 16, color: theme.textPrimary, paddingVertical: spacing.xs },

    createMealBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
    createMealText: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.textPrimary },
    createMealSubtext: { fontSize: 12, color: theme.textMuted },

    section: { marginBottom: spacing.lg },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: spacing.sm },

    foodItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
    foodIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.cardBackgroundLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
    foodEmoji: { fontSize: 22 },
    foodInfo: { flex: 1 },
    foodName: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
    foodNameHindi: { fontSize: 12, color: theme.textMuted },
    foodMeta: { fontSize: 11, color: theme.textMuted, textTransform: 'capitalize' },
    foodCalories: { alignItems: 'flex-end' },
    calorieNumber: { fontSize: 18, fontWeight: '700', color: theme.primary },
    calorieUnit: { fontSize: 10, color: theme.textMuted },

    loadingContainer: { padding: spacing.xl, alignItems: 'center' },
    noResults: { fontSize: 14, color: theme.textMuted, textAlign: 'center', padding: spacing.lg },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: spacing.lg },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
    modalTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },

    nutritionCard: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
    nutritionHeader: { alignItems: 'center', marginBottom: spacing.md },
    nutritionTitle: { fontSize: 22, fontWeight: '800' },
    macrosRow: { flexDirection: 'row', justifyContent: 'space-around' },
    macroItem: { alignItems: 'center' },
    macroValue: { fontSize: 18, fontWeight: '700' },
    macroLabel: { fontSize: 11, color: theme.textMuted },

    inputLabel: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
    standardServing: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    standardServingText: { fontSize: 13 },
    servingScroll: { paddingLeft: 20, marginBottom: 8 },
    servingBtn: { alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, padding: spacing.sm, marginRight: spacing.sm, minWidth: 70 },
    servingEmoji: { fontSize: 24 },
    servingLabel: { fontSize: 11, color: theme.textMuted, marginTop: 2 },

    quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.md },
    quantityBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center' },
    quantityDisplay: { backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
    quantityValue: { fontSize: 28, fontWeight: '800' },
    quickQuantities: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg },
    quickQtyBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: theme.cardBackground, borderRadius: borderRadius.sm },
    quickQtyText: { fontSize: 13 },

    mealTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    mealTypeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: theme.cardBackground, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    mealTypeLabel: { fontSize: 12, color: theme.textMuted },

    addFoodBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: borderRadius.lg, paddingVertical: spacing.md },
    addFoodBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    analysisOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    analysisBox: { backgroundColor: theme.cardBackground, padding: 30, borderRadius: 20, alignItems: 'center', gap: 10 },
    analysisText: { fontSize: 18, fontWeight: '700', marginTop: 10 },
    analysisSub: { fontSize: 14, color: theme.textMuted },

    aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4, marginTop: 10 },
    aiBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

    editAIBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
        marginHorizontal: spacing.lg,
        borderWidth: 1.5
    },
    editAIBtnText: { fontSize: 14, fontWeight: '600' },

    editInput: {
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 15,
        marginBottom: spacing.lg,
        marginHorizontal: spacing.lg,
        borderWidth: 1
    },

    editMacrosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
        marginHorizontal: spacing.lg
    },
    editMacroInput: {
        flex: 1,
        minWidth: '45%'
    },
    editMacroLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.textMuted,
        marginBottom: spacing.xs
    },
    macroInput: {
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        borderWidth: 1
    },
});

export default FoodSearchScreen;
