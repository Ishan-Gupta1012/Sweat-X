import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    FlatList,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { exerciseApi } from '../services/api';

const SplitExerciseEditorScreen = ({ route, navigation }) => {
    const { theme } = useTheme();
    const { userData, updateDayExercises, addExerciseToDay, removeExerciseFromDay } = useUser();

    const { dayIndex } = route.params || {};
    const session = userData.trainingPlan?.schedule?.[dayIndex];

    const [exercises, setExercises] = useState(session?.exercises || []);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    useEffect(() => {
        if (session?.exercises) {
            setExercises(session.exercises);
        }
    }, [session]);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            const result = await exerciseApi.searchExercises(query);
            if (result.success) {
                // Format exercise names with proper casing
                const formatted = result.exercises.map(ex => ({
                    ...ex,
                    displayName: ex.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                }));
                setSearchResults(formatted);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
        setLoading(false);
    };

    const handleAddExercise = (exercise) => {
        const newExercise = {
            name: exercise.displayName || exercise.name,
            category: exercise.category,
            type: exercise.type,
            sets: 3,
            reps: userData.trainingLevel === 'beginner' ? '8-12' : '6-10'
        };

        const updatedExercises = [...exercises, newExercise];
        setExercises(updatedExercises);
        addExerciseToDay(dayIndex, newExercise);

        setShowAddModal(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRemoveExercise = (exerciseIndex) => {
        Alert.alert(
            'Remove Exercise',
            `Remove "${exercises[exerciseIndex]?.name}" from this workout?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const updatedExercises = exercises.filter((_, i) => i !== exerciseIndex);
                        setExercises(updatedExercises);
                        removeExerciseFromDay(dayIndex, exerciseIndex);
                    }
                }
            ]
        );
    };

    const handleRegenerate = async () => {
        if (!session) return;

        setRegenerating(true);
        try {
            const result = await exerciseApi.recommendExercises(
                session.zones,
                userData.trainingLevel || 'beginner',
                session.exerciseLimit || 6
            );

            if (result.success && result.exercises) {
                setExercises(result.exercises);
                updateDayExercises(dayIndex, result.exercises);
            }
        } catch (error) {
            console.error('Regenerate error:', error);
            Alert.alert('Error', 'Failed to regenerate exercises. Please try again.');
        }
        setRegenerating(false);
    };

    const handleSave = () => {
        updateDayExercises(dayIndex, exercises);
        navigation.goBack();
    };

    if (!session) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={[styles.errorText, { color: theme.text }]}>Session not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{session.title}</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {exercises.length} exercises • {session.zones.join(', ')}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleRegenerate} style={styles.regenerateButton} disabled={regenerating}>
                    {regenerating ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <Ionicons name="refresh" size={22} color={theme.primary} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Exercise List */}
            <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
                {exercises.map((exercise, index) => (
                    <View key={index} style={[styles.exerciseCard, { backgroundColor: theme.card }]}>
                        <View style={styles.exerciseInfo}>
                            <Text style={[styles.exerciseName, { color: theme.text }]}>{exercise.name}</Text>
                            <View style={styles.exerciseMeta}>
                                <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                                    <Text style={[styles.badgeText, { color: theme.primary }]}>
                                        {exercise.sets} sets
                                    </Text>
                                </View>
                                <View style={[styles.badge, { backgroundColor: theme.secondary + '20' }]}>
                                    <Text style={[styles.badgeText, { color: theme.secondary }]}>
                                        {exercise.reps} reps
                                    </Text>
                                </View>
                                <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
                                    {exercise.category}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => handleRemoveExercise(index)}
                            style={styles.removeButton}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF9500" />
                        </TouchableOpacity>
                    </View>
                ))}

                {exercises.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="barbell-outline" size={48} color={theme.textSecondary} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            No exercises yet
                        </Text>
                        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                            Add exercises or tap regenerate
                        </Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.bottomActions, { backgroundColor: theme.background }]}>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.card, marginBottom: 12 }]}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={24} color={theme.primary} />
                    <Text style={[styles.addButtonText, { color: theme.primary }]}>Add Exercise</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                </TouchableOpacity>
            </View>

            {/* Add Exercise Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Exercise</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
                            <Ionicons name="search" size={20} color={theme.textSecondary} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder="Search exercises..."
                                placeholderTextColor={theme.textSecondary}
                                value={searchQuery}
                                onChangeText={handleSearch}
                                autoFocus
                            />
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                        ) : (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item, index) => `${item.name}-${index}`}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.searchResult, { borderBottomColor: theme.border }]}
                                        onPress={() => handleAddExercise(item)}
                                    >
                                        <View>
                                            <Text style={[styles.resultName, { color: theme.text }]}>
                                                {item.displayName}
                                            </Text>
                                            <Text style={[styles.resultCategory, { color: theme.textSecondary }]}>
                                                {item.category} • {item.type}
                                            </Text>
                                        </View>
                                        <Ionicons name="add-circle" size={24} color={theme.primary} />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={() => (
                                    searchQuery.length >= 2 && !loading ? (
                                        <Text style={[styles.noResults, { color: theme.textSecondary }]}>
                                            No exercises found
                                        </Text>
                                    ) : null
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    regenerateButton: {
        padding: 8,
    },
    exerciseList: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    exerciseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoryText: {
        fontSize: 12,
        textTransform: 'capitalize',
    },
    removeButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 4,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 24,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
    },
    searchResult: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    resultName: {
        fontSize: 16,
        fontWeight: '500',
    },
    resultCategory: {
        fontSize: 12,
        marginTop: 2,
        textTransform: 'capitalize',
    },
    noResults: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
});

export default SplitExerciseEditorScreen;
