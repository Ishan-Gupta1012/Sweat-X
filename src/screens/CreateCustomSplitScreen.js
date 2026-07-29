import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import PrimaryButton from '../components/PrimaryButton';
import { exerciseApi } from '../services/api';

const CreateCustomSplitScreen = ({ navigation, route }) => {
    const { theme, isDarkMode } = useTheme();
    const { addCustomSplit } = useUser();
    const [name, setName] = useState('');
    const [selectedZones, setSelectedZones] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [customExercise, setCustomExercise] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    useEffect(() => {
        if (route.params?.newExercise) {
            setExercises(prev => [...prev, route.params.newExercise]);
            setCustomExercise('');
            navigation.setParams({ newExercise: undefined });
        }
    }, [route.params?.newExercise]);

    const styles = useMemo(() => createStyles(theme), [theme]);

    const targetZones = [
        { id: 'chest', label: 'Chest' },
        { id: 'back', label: 'Back' },
        { id: 'shoulders', label: 'Shoulders' },
        { id: 'arms', label: 'Arms' },
        { id: 'biceps', label: 'Biceps' },
        { id: 'triceps', label: 'Triceps' },
        { id: 'abs', label: 'Abs & Core' },
        { id: 'legs', label: 'Legs' },
    ];

    const toggleZone = (id) => {
        setSelectedZones(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const fetchSuggestions = async (query = '') => {
        setIsLoadingSuggestions(true);
        try {
            let result;
            if (query.trim().length >= 2) {
                result = await exerciseApi.searchExercises(query.trim());
            } else if (query.trim().length === 0) {
                const targetCategory = selectedZones.length > 0 ? selectedZones[0] : null;
                result = await exerciseApi.getExercises(targetCategory);
            }
            if (result && result.success) {
                const formatted = result.exercises.map(ex => ({
                    ...ex,
                    displayName: ex.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                })).slice(0, 10);
                setSearchResults(formatted);
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [selectedZones]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSuggestions(customExercise);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [customExercise]);

    const handleSave = () => {
        if (!name.trim() || selectedZones.length === 0) return;
        addCustomSplit(name.trim(), selectedZones, exercises);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Split</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Name Your Split</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.textPrimary }]}
                    placeholder="e.g. Chest + Biceps"
                    placeholderTextColor={theme.textMuted}
                    value={name}
                    onChangeText={setName}
                />

                <Text style={styles.sectionTitle}>Select Muscle Groups</Text>
                <View style={styles.grid}>
                    {targetZones.map(zone => (
                        <TouchableOpacity
                            key={zone.id}
                            style={[styles.zoneCard, selectedZones.includes(zone.id) && styles.zoneSelected]}
                            onPress={() => toggleZone(zone.id)}
                        >
                            <Text style={[styles.zoneLabel, selectedZones.includes(zone.id) && styles.selectedText]}>{zone.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Add Exercises (Optional)</Text>
                
                {exercises.map((ex, index) => (
                    <View key={index} style={styles.exerciseItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.exerciseName}>{ex.name}</Text>
                            <Text style={styles.exerciseMeta}>{ex.sets.length} Sets • {ex.category}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setExercises(prev => prev.filter((_, i) => i !== index))}>
                            <Ionicons name="trash-outline" size={20} color="#FF5252" />
                        </TouchableOpacity>
                    </View>
                ))}

                <View style={styles.customInputRow}>
                    <TextInput
                        style={[styles.customInput, { backgroundColor: theme.cardBackground, color: theme.textPrimary }]}
                        placeholder="Type exercise name..."
                        placeholderTextColor={theme.textMuted}
                        value={customExercise}
                        onChangeText={setCustomExercise}
                    />
                    {!!customExercise.trim() && (
                        <TouchableOpacity
                            style={[styles.customAddBtn, { backgroundColor: theme.brandWorkout }]}
                            onPress={() => {
                                navigation.navigate('AddExerciseDetails', {
                                    exerciseName: customExercise.trim(),
                                    category: 'strength',
                                    origin: 'CreateCustomSplit'
                                });
                            }}
                        >
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {isLoadingSuggestions ? (
                    <ActivityIndicator size="small" color={theme.brandWorkout} style={{ marginTop: 20 }} />
                ) : (
                    <View style={{ marginTop: 12 }}>
                        {searchResults.map((item, index) => (
                            <TouchableOpacity
                                key={`${item.name}-${index}`}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingVertical: 12,
                                    borderBottomWidth: 1,
                                    borderBottomColor: theme.border,
                                }}
                                onPress={() => {
                                    navigation.navigate('AddExerciseDetails', {
                                        exerciseName: item.displayName || item.name,
                                        category: item.category,
                                        origin: 'CreateCustomSplit'
                                    });
                                }}
                            >
                                <View>
                                    <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '500' }}>
                                        {item.displayName || item.name}
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' }}>
                                        {item.category} • {item.type}
                                    </Text>
                                </View>
                                <Ionicons name="add-circle" size={24} color={theme.brandWorkout} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <PrimaryButton
                    title="Save Split"
                    onPress={handleSave}
                    disabled={!name.trim() || selectedZones.length === 0}
                />
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
    backButton: { width: 44, height: 44, borderRadius: borderRadius.sm, backgroundColor: theme.cardBackgroundLight, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
    content: { padding: spacing.lg },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: theme.textMuted, marginBottom: spacing.md, letterSpacing: 2, textTransform: 'uppercase' },
    input: { height: 60, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, fontSize: 16, fontWeight: '700', borderWidth: 1.5, borderColor: theme.border, marginBottom: spacing.xl },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    zoneCard: { width: '47%', paddingVertical: 20, backgroundColor: theme.cardBackground, borderRadius: borderRadius.sm, alignItems: 'center', borderWidth: 1.5, borderColor: theme.border },
    zoneSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
    zoneLabel: { fontSize: 14, fontWeight: '800', color: theme.textPrimary, textTransform: 'uppercase' },
    selectedText: { color: '#fff' },
    footer: { padding: spacing.lg, borderTopWidth: 1.5, borderTopColor: theme.border },
    exerciseItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBackground, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: theme.border },
    exerciseName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
    exerciseMeta: { fontSize: 12, color: theme.textMuted, marginTop: 4, textTransform: 'capitalize' },
    customInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 12 },
    customInput: { flex: 1, height: 50, borderRadius: borderRadius.md, paddingHorizontal: 16, fontSize: 14, fontWeight: '600', borderWidth: 1.5, borderColor: theme.border },
    customAddBtn: { width: 50, height: 50, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
});

export default CreateCustomSplitScreen;
