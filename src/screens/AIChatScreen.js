import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import geminiService from '../services/gemini';

const AIChatScreen = ({ navigation }) => {
    const { theme, isDarkMode } = useTheme();
    const { userData } = useUser();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            text: "Hey! I'm your fitness assistant. Ask me anything about workouts, nutrition, or exercise form. I'm here to help you reach your goals! 💪",
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef(null);
    const styles = useMemo(() => createStyles(theme), [theme]);

    const sendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const userText = message.trim();
        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: userText,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setMessage('');
        setIsLoading(true);

        // Scroll to bottom immediately
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const aiResponseText = await geminiService.chatWithCoach(userText, userData);

            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                text: aiResponseText,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);

            // More specific error message based on the error
            let errorText = "I'm having a bit of trouble connecting to the gym wifi! 🏋️‍♂️ Please try asking again.";

            // If it's a configuration error (API key not set), show clearer message
            if (error.message && error.message.includes('not configured')) {
                errorText = "🔧 CoreCoach is currently under maintenance. Please try again later.";
            } else if (error.message && error.message.includes('authentication')) {
                errorText = "🔐 Authentication issue detected. Please contact support if this persists.";
            }

            const errorMessage = {
                id: Date.now() + 1,
                type: 'ai',
                text: errorText,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, isLoading]);

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const quickQuestions = [
        "How much protein do I need?",
        "Best exercises for abs?",
        "How to improve squat form?",
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>CORECOACH</Text>
                    <View style={styles.onlineBadge}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>STATION ONLINE</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.infoButton}>
                    <Ionicons name="information-circle-outline" size={24} color={theme.textMuted} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Chat Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.chatContainer}
                    contentContainerStyle={styles.chatContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                styles.messageRow,
                                msg.type === 'user' ? styles.userRow : styles.aiRow,
                            ]}
                        >
                            {msg.type === 'ai' && (
                                <View style={styles.aiAvatar}>
                                    <LinearGradient
                                        colors={['#1A1A1A', '#0A0A0A']}
                                        style={styles.avatarGradient}
                                    >
                                        <Ionicons name="flash" size={14} color={theme.brandAI} />
                                    </LinearGradient>
                                </View>
                            )}
                            <View style={[
                                styles.bubble,
                                msg.type === 'user' ? styles.userBubble : styles.aiBubble,
                            ]}>
                                {msg.type === 'user' && (
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.brandAI }]} />
                                )}
                                <Text style={[
                                    styles.messageText,
                                    { color: msg.type === 'user' ? '#FFFFFF' : theme.textPrimary },
                                ]}>
                                    {msg.text}
                                </Text>
                                <Text style={[
                                    styles.timestamp,
                                    { color: msg.type === 'user' ? 'rgba(255,255,255,0.7)' : theme.textMuted }
                                ]}>
                                    {formatTime(msg.timestamp)}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {isLoading && (
                        <View style={styles.aiRow}>
                            <View style={styles.aiAvatar}>
                                <LinearGradient
                                    colors={['#1A1A1A', '#0A0A0A']}
                                    style={styles.avatarGradient}
                                >
                                    <Ionicons name="flash" size={14} color={theme.brandAI} />
                                </LinearGradient>
                            </View>
                            <View style={[styles.bubble, styles.aiBubble, { width: 60, height: 40, justifyContent: 'center' }]}>
                                <View style={styles.typingContainer}>
                                    <View style={[styles.typingDot, { backgroundColor: theme.brandAI }]} />
                                    <View style={[styles.typingDot, { backgroundColor: theme.brandAI, opacity: 0.6 }]} />
                                    <View style={[styles.typingDot, { backgroundColor: theme.brandAI, opacity: 0.3 }]} />
                                </View>
                            </View>
                        </View>
                    )}

                </ScrollView>

                {/* Quick Questions - Horizontal Pills */}
                {messages.length <= 2 && (
                    <View style={{ marginBottom: 12 }}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.suggestionsContainer}
                            style={{ maxHeight: 50 }}
                        >
                            {quickQuestions.map((q, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.suggestionChip, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                                    onPress={() => setMessage(q)}
                                >
                                    <Text style={[styles.suggestionText, { color: theme.textPrimary }]}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Message CoreCoach..."
                            placeholderTextColor="#666"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                !message.trim() && { opacity: 0.5 }
                            ]}
                            onPress={sendMessage}
                            disabled={!message.trim()}
                        >
                            <View style={[styles.sendGradient, { backgroundColor: theme.brandAI }]}>
                                <Ionicons
                                    name="arrow-up"
                                    size={20}
                                    color="#FFFFFF"
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.border,
    },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: theme.textPrimary, letterSpacing: 2 },
    onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.brandAI },
    onlineText: { fontSize: 8, fontWeight: '600', color: theme.textSecondary, letterSpacing: 1 },
    backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    infoButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

    content: { flex: 1 },
    chatContainer: { flex: 1 },
    chatContent: { padding: spacing.lg },

    messageRow: { flexDirection: 'row', marginBottom: spacing.lg, alignItems: 'flex-end' },
    userRow: { justifyContent: 'flex-end' },
    aiRow: { justifyContent: 'flex-start' },

    aiAvatar: { marginRight: spacing.sm },
    avatarGradient: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border },

    bubble: {
        maxWidth: '80%',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 12,
        overflow: 'hidden',
    },
    aiBubble: {
        backgroundColor: theme.cardBackground,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: theme.border,
    },
    userBubble: {
        backgroundColor: theme.brandAI,
        borderBottomRightRadius: 4,
    },
    messageText: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
    timestamp: { fontSize: 9, fontWeight: '500', marginTop: 6, opacity: 0.5 },

    suggestionsContainer: { paddingHorizontal: spacing.lg, gap: 10 },
    suggestionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBackground },
    suggestionText: { fontSize: 12, fontWeight: '500', color: theme.textPrimary },

    inputContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.cardBackground,
        borderRadius: 24,
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: theme.border,
    },
    input: { flex: 1, color: theme.textPrimary, fontSize: 14, fontWeight: '500', paddingHorizontal: 12, maxHeight: 100 },
    sendButton: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
    sendGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    typingContainer: { flexDirection: 'row', gap: 4, paddingVertical: 10 },
    typingDot: { width: 6, height: 6, borderRadius: 3 },
});

export default AIChatScreen;
