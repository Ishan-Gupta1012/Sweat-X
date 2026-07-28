import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import geminiService from '../services/gemini';

const AIChatScreen = ({ navigation }) => {
    const { theme, isDarkMode } = useTheme();
    const { userData, createAIChat, updateAIChat, renameAIChat, deleteAIChat, setActiveChatId } = useUser();
    
    // UI states
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [editingChatId, setEditingChatId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');

    const scrollViewRef = useRef(null);
    const styles = useMemo(() => createStyles(theme), [theme]);

    const activeChat = userData.aiChats?.find(c => c.id === userData.activeChatId);
    
    const defaultMessage = {
        id: 1,
        type: 'ai',
        text: "Hey! I'm your fitness assistant. Ask me anything about workouts, nutrition, or exercise form. I'm here to help you reach your goals! 💪",
        timestamp: new Date().toISOString(),
    };

    const messages = activeChat?.messages?.length > 0 ? activeChat.messages : [defaultMessage];

    const sendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const userText = message.trim();
        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: userText,
            timestamp: new Date().toISOString(),
        };

        let currentChatId = userData.activeChatId;
        let newMessages = [...messages, userMessage];

        if (!currentChatId) {
            currentChatId = createAIChat(userText);
            // Default message should be included in history when creating a new chat
            newMessages = [defaultMessage, userMessage];
        }

        updateAIChat(currentChatId, newMessages);
        setMessage('');
        setIsLoading(true);

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const historyContext = messages.map(msg => ({ type: msg.type, text: msg.text }));
            const aiResponseText = await geminiService.chatWithCoach(userText, userData, historyContext);

            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                text: aiResponseText,
                timestamp: new Date().toISOString(),
            };
            
            updateAIChat(currentChatId, [...newMessages, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            let errorText = "I'm having a bit of trouble connecting to the gym wifi! 🏋️‍♂️ Please try asking again.";
            if (error.message && error.message.includes('not configured')) {
                errorText = "🔧 CoreCoach is currently under maintenance. Please try again later.";
            } else if (error.message && error.message.includes('authentication')) {
                errorText = "🔐 Authentication issue detected. Please contact support if this persists.";
            }
            const errorMessage = {
                id: Date.now() + 1,
                type: 'ai',
                text: errorText,
                timestamp: new Date().toISOString(),
            };
            updateAIChat(currentChatId, [...newMessages, errorMessage]);
        } finally {
            setIsLoading(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const handleNewChat = () => {
        setActiveChatId(null);
        setShowHistory(false);
    };

    const handleRenameSubmit = (chatId) => {
        if (editingTitle.trim()) {
            renameAIChat(chatId, editingTitle.trim());
        }
        setEditingChatId(null);
        setEditingTitle('');
    };

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, isLoading]);

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
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
                    onPress={() => setShowHistory(true)}
                >
                    <Ionicons name="menu" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>CORECOACH</Text>
                    <View style={styles.onlineBadge}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>STATION ONLINE</Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={handleNewChat}
                >
                    <Ionicons name="create-outline" size={22} color={theme.textPrimary} />
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

            {/* History Modal Drawer */}
            <Modal
                visible={showHistory}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHistory(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.historyDrawer, { backgroundColor: theme.background }]}>
                        <View style={styles.historyHeader}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeDrawerButton}>
                                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.historyTitle}>Past Chats</Text>
                            <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.closeDrawerButton}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.historyList}>
                            {userData.aiChats && userData.aiChats.length === 0 ? (
                                <Text style={styles.emptyHistoryText}>No past chats found.</Text>
                            ) : (
                                userData.aiChats?.map(chat => (
                                    <View 
                                        key={chat.id} 
                                        style={[
                                            styles.historyItem,
                                            chat.id === userData.activeChatId && styles.historyItemActive
                                        ]}
                                    >
                                        <TouchableOpacity 
                                            style={styles.historyItemContent}
                                            onPress={() => {
                                                setActiveChatId(chat.id);
                                                setShowHistory(false);
                                            }}
                                        >
                                            {editingChatId === chat.id ? (
                                                <TextInput
                                                    style={styles.renameInput}
                                                    value={editingTitle}
                                                    onChangeText={setEditingTitle}
                                                    onBlur={() => handleRenameSubmit(chat.id)}
                                                    onSubmitEditing={() => handleRenameSubmit(chat.id)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <Text 
                                                    style={[styles.historyItemTitle, { color: theme.textPrimary }]}
                                                    numberOfLines={1}
                                                >
                                                    {chat.title}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                        
                                        <View style={styles.historyActions}>
                                            <TouchableOpacity 
                                                style={styles.historyActionBtn}
                                                onPress={() => {
                                                    setEditingChatId(chat.id);
                                                    setEditingTitle(chat.title);
                                                }}
                                            >
                                                <Ionicons name="pencil" size={16} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={styles.historyActionBtn}
                                                onPress={() => deleteAIChat(chat.id)}
                                            >
                                                <Ionicons name="trash-outline" size={16} color={theme.error || '#FF453A'} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                        
                        <TouchableOpacity style={[styles.newChatDrawerBtn, { backgroundColor: theme.brandAI }]} onPress={handleNewChat}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.newChatDrawerText}>Start New Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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

    // History Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
    historyDrawer: { width: '85%', height: '100%', padding: spacing.lg, borderRightWidth: 1, borderColor: theme.border },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, marginTop: Platform.OS === 'ios' ? 40 : 20 },
    historyTitle: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary },
    closeDrawerButton: { padding: spacing.sm },
    historyList: { flex: 1 },
    emptyHistoryText: { textAlign: 'center', color: theme.textSecondary, marginTop: spacing.xl },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.border },
    historyItemActive: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 8 },
    historyItemContent: { flex: 1 },
    historyItemTitle: { fontSize: 16, fontWeight: '500' },
    renameInput: { fontSize: 16, color: theme.textPrimary, borderBottomWidth: 1, borderBottomColor: theme.brandAI, paddingVertical: 0 },
    historyActions: { flexDirection: 'row', gap: 8 },
    historyActionBtn: { padding: 4 },
    newChatDrawerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: 12, marginTop: spacing.lg, gap: 8 },
    newChatDrawerText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default AIChatScreen;
