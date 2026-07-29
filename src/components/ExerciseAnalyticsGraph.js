import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const windowWidth = Dimensions.get('window').width;

const ExerciseAnalyticsGraph = ({ exerciseName, workoutHistory }) => {
    const { theme, isDarkMode } = useTheme();
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedPoint, setSelectedPoint] = useState(null);

    const chartData = useMemo(() => {
        if (!workoutHistory || workoutHistory.length === 0) return [];

        const dataPoints = [];

        // Sort all history newest to oldest first
        const sortedHistory = [...workoutHistory].sort((a, b) => {
            const dateA = new Date(b.date || b.timestamp || b.createdAt);
            const dateB = new Date(a.date || a.timestamp || a.createdAt);
            return dateA - dateB;
        });

        // Find workouts containing this exercise
        for (let i = 0; i < sortedHistory.length; i++) {
            const workout = sortedHistory[i];
            const exercises = workout.exercises || [];
            const targetEx = exercises.find(ex => ex.name.toLowerCase().trim() === exerciseName.toLowerCase().trim());
            
            if (targetEx && targetEx.sets && targetEx.sets.length > 0) {
                const maxWeight = Math.max(...targetEx.sets.map(s => Number(s.weight) || 0));
                const totalReps = targetEx.sets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0);
                
                const dateStr = workout.date || workout.timestamp || workout.createdAt;
                const wDate = new Date(dateStr);
                
                // Formats like "Oct 12"
                const dateLabel = wDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const fullDate = wDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

                if (maxWeight > 0 || totalReps > 0) {
                    dataPoints.push({ 
                        dateLabel, 
                        fullDate,
                        maxWeight, 
                        totalReps,
                        sets: targetEx.sets 
                    });
                }
            }

            // Stop when we have 16 workouts
            if (dataPoints.length >= 16) break;
        }

        // Reverse to show oldest (of the 16) to newest on the graph
        return dataPoints.reverse();
    }, [exerciseName, workoutHistory]);

    if (chartData.length === 0) {
        return null;
    }

    const maxGraphWeight = Math.max(...chartData.map(d => d.maxWeight), 10);
    const GRAPH_HEIGHT = 120; // Slightly taller
    
    // Width available for the graph line
    const GRAPH_WIDTH = windowWidth - 64; 
    
    const points = chartData.map((d, i) => {
        const stepX = chartData.length > 1 ? GRAPH_WIDTH / (chartData.length - 1) : GRAPH_WIDTH / 2;
        const x = chartData.length > 1 ? (i * stepX) : stepX;
        const y = GRAPH_HEIGHT - Math.max((d.maxWeight / maxGraphWeight) * (GRAPH_HEIGHT - 20), 4);
        return { ...d, x, y };
    });

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F5F5' }]}>
            <TouchableOpacity 
                style={styles.headerRow} 
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <View>
                    <Text style={[styles.title, { color: theme.textSecondary }]}>Past 16 Workouts</Text>
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>Max Weight (kg)</Text>
                </View>
                <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.textMuted} 
                />
            </TouchableOpacity>
            
            {isExpanded && (
                <View style={[styles.graphArea, { height: GRAPH_HEIGHT + 40 }]}>
                    {/* Render Lines */}
                    {points.map((p, i) => {
                        if (i === 0) return null;
                        const prev = points[i - 1];
                        const dx = p.x - prev.x;
                        const dy = p.y - prev.y;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                        const cx = (prev.x + p.x) / 2;
                        const cy = (prev.y + p.y) / 2;
                        
                        return (
                            <View 
                                key={`line-${i}`} 
                                style={{
                                    position: 'absolute',
                                    left: cx - length / 2,
                                    top: cy - 1.5,
                                    width: length,
                                    height: 3,
                                    backgroundColor: theme.brandWorkout,
                                    transform: [{ rotate: `${angle}deg` }],
                                    opacity: 0.6
                                }} 
                            />
                        );
                    })}

                    {/* Render Dots & Labels */}
                    {points.map((p, i) => (
                        <View key={`point-${i}`} style={{ position: 'absolute', left: p.x, top: p.y, alignItems: 'center' }}>
                            <TouchableOpacity 
                                onPress={() => setSelectedPoint(p)}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                style={{
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <View style={[styles.dot, { backgroundColor: theme.brandWorkout }]} />
                            </TouchableOpacity>
                            
                            {/* Weight Label (above dot) */}
                            <Text style={[styles.weightLabel, { color: theme.textPrimary, top: -24 }]}>
                                {p.maxWeight}
                            </Text>
                            
                            {/* Date Label (bottom of graph) - rotated slightly to fit 16 points */}
                            <Text 
                                style={[styles.dateLabel, { 
                                    color: theme.textMuted, 
                                    top: GRAPH_HEIGHT - p.y + 10,
                                    transform: [{ rotate: '-45deg' }],
                                    width: 40,
                                    left: -20
                                }]}
                                numberOfLines={1}
                            >
                                {p.dateLabel}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Modal for Workout Details Log */}
            <Modal
                transparent={true}
                visible={!!selectedPoint}
                animationType="fade"
                onRequestClose={() => setSelectedPoint(null)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setSelectedPoint(null)}>
                    <Pressable style={[styles.modalContent, { backgroundColor: isDarkMode ? '#222' : '#FFF' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{selectedPoint?.fullDate}</Text>
                            <TouchableOpacity onPress={() => setSelectedPoint(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                            Max Weight: <Text style={{ color: theme.brandWorkout }}>{selectedPoint?.maxWeight}kg</Text>
                        </Text>
                        
                        <ScrollView style={{ maxHeight: 200, marginTop: 12 }}>
                            {selectedPoint?.sets?.map((set, idx) => (
                                <View key={idx} style={[styles.setRow, { borderBottomColor: theme.border }]}>
                                    <Text style={[styles.setLabel, { color: theme.textMuted }]}>Set {idx + 1}</Text>
                                    <Text style={[styles.setValue, { color: theme.textPrimary }]}>
                                        {set.weight} kg  ×  {set.reps} reps
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 24, // Extra space for rotated text
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    graphArea: {
        marginTop: 30, // extra space for weight labels above dots
        position: 'relative',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#000', // simple contrast outline
    },
    weightLabel: {
        position: 'absolute',
        fontSize: 10,
        fontWeight: 'bold',
        width: 24,
        textAlign: 'center',
    },
    dateLabel: {
        position: 'absolute',
        fontSize: 9,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '900',
    },
    modalSubtitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    setLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    setValue: {
        fontSize: 14,
        fontWeight: '800',
    }
});

export default ExerciseAnalyticsGraph;
