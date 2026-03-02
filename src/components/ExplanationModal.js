import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius } from '../constants/colors';

const ExplanationModal = ({ visible, onClose, title, content = [], onAskAI }) => {
    const { theme } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
                <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={theme.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {content.map((item, index) => (
                            <View key={index} style={styles.bulletItem}>
                                <Ionicons name="checkmark-circle" size={18} color={theme.primary} style={styles.bulletIcon} />
                                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{item}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity
                            style={[styles.aiBtn, { backgroundColor: theme.primary + '15' }]}
                            onPress={() => {
                                onClose();
                                onAskAI();
                            }}
                        >
                            <Ionicons name="sparkles" size={18} color={theme.primary} />
                            <Text style={[styles.aiBtnText, { color: theme.primary }]}>Ask AI more about this</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.gotItBtn, { backgroundColor: theme.primary }]}
                            onPress={onClose}
                        >
                            <Text style={styles.gotItText}>Got it</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingVertical: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: spacing.lg,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    bulletIcon: {
        marginTop: 2,
        marginRight: spacing.md,
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        gap: spacing.md,
    },
    aiBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: borderRadius.md,
        gap: 8,
    },
    aiBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    gotItBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: borderRadius.md,
    },
    gotItText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default ExplanationModal;
