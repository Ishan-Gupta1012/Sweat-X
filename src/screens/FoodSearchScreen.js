import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, Alert, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../services/api';

const FoodSearchScreen = ({ navigation, route }) => {
    const { theme, isDarkMode } = useTheme();
    const initialMealType = route.params?.mealType || 'lunch';

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [popularFoods, setPopularFoods] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        navigation.navigate('FoodQuantity', {
            food,
            mealType: initialMealType,
            isEditing: false
        });
    };

    const handleCameraPress = async () => {
        Alert.alert(
            'Scan Food',
            'Choose a source to identify your meal',
            [
                { text: 'Take Photo', onPress: () => openCamera() },
                { text: 'Choose from Gallery', onPress: () => openGallery() },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const openCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Camera Permission Required', 'TrueFit needs camera access to scan food.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.4,
                maxWidth: 800,
                maxHeight: 800,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].base64) {
                const asset = result.assets[0];
                analyzeImage(asset.base64, asset.mimeType || 'image/jpeg');
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
                Alert.alert('Gallery Permission Required', 'TrueFit needs gallery access.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.4,
                maxWidth: 800,
                maxHeight: 800,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].base64) {
                const asset = result.assets[0];
                analyzeImage(asset.base64, asset.mimeType || 'image/jpeg');
            }
        } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert('Error', 'Could not access photo library.');
        }
    };

    const analyzeImage = async (base64, mimeType = 'image/jpeg') => {
        setIsAnalyzing(true);
        try {
            const response = await fetch(`${API_URL}/foods/analyze-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64, mimeType }),
            });

            if (!response.ok) throw new Error('Server error');

            const data = await response.json();
            if (data.success && data.analysis) {
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
                navigation.navigate('FoodQuantity', {
                    food: aiFood,
                    mealType: initialMealType,
                    isEditing: false
                });
            } else {
                Alert.alert('Recognition Failed', 'Could not identify food. Try again.');
            }
        } catch (error) {
            console.error('AI analysis error:', error);
            Alert.alert('Analysis Error', 'Failed to analyze image.');
        } finally {
            setIsAnalyzing(false);
        }
    };

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
                        <Text style={styles.sectionTitle}>Search Results ({searchResults.length})</Text>
                        {searchResults.length === 0 ? (
                            <Text style={styles.noResults}>No foods found for "{searchQuery}"</Text>
                        ) : (
                            searchResults.map((food) => <FoodItem key={food._id} food={food} />)
                        )}
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Popular Foods</Text>
                        {popularFoods.map((food) => <FoodItem key={food._id} food={food} />)}
                    </View>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>

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

    analysisOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    analysisBox: { backgroundColor: theme.cardBackground, padding: 30, borderRadius: 20, alignItems: 'center', gap: 10 },
    analysisText: { fontSize: 18, fontWeight: '700', marginTop: 10 },
    analysisSub: { fontSize: 14, color: theme.textMuted },
});

export default FoodSearchScreen;
