import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import PrimaryButton from '../components/PrimaryButton';

const CreateCustomSplitScreen = ({ navigation }) => {
    const { theme, isDarkMode } = useTheme();
    const { addCustomSplit } = useUser();
    const [name, setName] = useState('');
    const [selectedZones, setSelectedZones] = useState([]);

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

    const handleSave = () => {
        if (!name.trim() || selectedZones.length === 0) return;
        addCustomSplit(name.trim(), selectedZones);
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
});

export default CreateCustomSplitScreen;
