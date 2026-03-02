import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Alert, Animated, Modal, Platform, Switch, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { spacing, borderRadius } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = ({ navigation }) => {
    const { userData, updateProfile, clearAllData } = useUser();
    const { isDarkMode, toggleTheme, theme } = useTheme();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            // Update profile with new image
            if (updateProfile) {
                updateProfile({ profileImage: uri });
            } else {
                console.warn('updateProfile function not found in context');
            }
        }
    };

    const user = {
        name: userData.name || 'Fitness Warrior',
        age: userData.age || 25,
        height: userData.height || 170,
        gender: userData.gender || 'Not set',
        workouts: userData.totalWorkouts || 0,
        goal: userData.primaryGoal?.replace('_', ' ') || 'Build muscle',
        currentWeight: userData.currentWeight || 75,
        targetWeight: userData.targetWeight || 70,
        calorieGoal: userData.calorieGoal || 2000,
        profileImage: userData.profileImage,
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            setShowLogoutModal(true);
        } else {
            Alert.alert(
                'Log Out',
                'Are you sure you want to log out? Your data will be cleared.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Yes, Log Out',
                        style: 'destructive',
                        onPress: confirmLogout
                    },
                ]
            );
        }
    };

    const confirmLogout = async () => {
        setShowLogoutModal(false);
        await clearAllData();
        navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    };

    const handleResetData = () => {
        if (Platform.OS === 'web') {
            setShowResetModal(true);
        } else {
            Alert.alert(
                'Reset All Data',
                'This will PERMANENTLY delete all your workout history, weight logs, and profile settings. This action cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Reset Everything',
                        style: 'destructive',
                        onPress: confirmReset
                    },
                ]
            );
        }
    };

    const confirmReset = async () => {
        setShowResetModal(false);
        await clearAllData(); // useUser provides this to clear context & storage
        navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PROFILE</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Profile Hero */}
                <View style={styles.heroCard}>
                    <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                        <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }], borderColor: '#06B6D4' }]}>
                            <View style={styles.avatar}>
                                {user.profileImage ? (
                                    <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                                )}
                            </View>
                            <View style={[styles.editIconBadge, { backgroundColor: '#06B6D4' }]}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        </Animated.View>
                    </TouchableOpacity>
                    <Animated.Text style={styles.userName}>{user.name}</Animated.Text>
                    <View style={[styles.goalBadge, { backgroundColor: '#8B5CF620', borderColor: '#8B5CF650' }]}>
                        <Ionicons name="flag" size={14} color="#8B5CF6" />
                        <Text style={[styles.goalText, { color: '#8B5CF6' }]}>{user.goal}</Text>
                    </View>
                </View>


                {/* Free Badge */}
                <View style={[styles.freeCard, { backgroundColor: '#10B98115' }]}>
                    <View style={[styles.freeIcon, { backgroundColor: '#10B981' }]}>
                        <Ionicons name="heart" size={24} color="#fff" />
                    </View>
                    <View>
                        <Text style={[styles.freeTitle, { color: '#10B981' }]}>100% Free Forever</Text>
                        <Text style={styles.freeSubtitle}>No subscriptions. No hidden fees.</Text>
                    </View>
                </View>
                {/* Admin Portal (Only visible to verified Admins) */}
                {userData?.isAdmin && (
                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: theme.brandAI + '15', marginBottom: spacing.md, borderWidth: 1, borderColor: theme.brandAI + '40', borderRadius: 12 }]}
                        onPress={() => navigation.navigate('AdminDashboard')}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: theme.brandAI + '30' }]}>
                            <Ionicons name="shield-checkmark" size={20} color={theme.brandAI} />
                        </View>
                        <Text style={[styles.menuLabel, { color: theme.brandAI, fontWeight: '800' }]}>Admin Portal</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.brandAI} />
                    </TouchableOpacity>
                )}

                {/* Menu */}
                <View style={styles.menu}>
                    {[
                        { icon: 'flag-outline', label: 'Goals & Targets', color: '#8B5CF6', screen: 'Goals' },
                        { icon: 'analytics-outline', label: 'Body Metrics', color: '#10B981', screen: 'BodyMetrics' },
                        { icon: 'time-outline', label: 'Workout History', color: '#3B82F6', screen: 'WorkoutHistory' },
                        { icon: 'nutrition-outline', label: 'Nutrition Log', color: '#EC4899', screen: 'NutritionLog' },
                    ].map((item, i, arr) => (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.menuItem,
                                i === arr.length - 1 && { borderBottomWidth: 0 }
                            ]}
                            onPress={() => item.screen && navigation.navigate(item.screen)}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                                <Ionicons name={item.icon} size={20} color={item.color} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Reset App Data */}
                <TouchableOpacity style={styles.themeCard} onPress={handleResetData}>
                    <View style={styles.themeInfo}>
                        <View style={[styles.themeIcon, { backgroundColor: theme.error + '20' }]}>
                            <Ionicons name="refresh" size={20} color={theme.error} />
                        </View>
                        <View>
                            <Text style={styles.themeTitle}>Reset App Data</Text>
                            <Text style={styles.themeSubtitle}>Clear all history and start fresh</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={theme.error} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.builtByText}>Designed and Built by </Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://www.linkedin.com/in/ishan-gupta-08686631a/')}>
                        <Text style={styles.devLink}>Ishan Gupta</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Logout Confirmation Modal (for web) */}
            <Modal visible={showLogoutModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons name="log-out-outline" size={48} color={theme.error} style={{ marginBottom: spacing.md }} />
                        <Text style={styles.modalTitle}>Log Out</Text>
                        <Text style={styles.modalMessage}>Are you sure you want to log out? Your session data will be cleared.</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setShowLogoutModal(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnConfirm]}
                                onPress={confirmLogout}
                            >
                                <Text style={styles.modalBtnConfirmText}>Yes, Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Reset Confirmation Modal */}
            <Modal visible={showResetModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { borderColor: theme.error + '50' }]}>
                        <Ionicons name="refresh-circle" size={48} color={theme.error} style={{ marginBottom: spacing.md }} />
                        <Text style={styles.modalTitle}>Reset All Data?</Text>
                        <Text style={styles.modalMessage}>This will permanently delete your workout history, stats, and personalized settings. This cannot be undone.</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setShowResetModal(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnConfirm]}
                                onPress={confirmReset}
                            >
                                <Text style={styles.modalBtnConfirmText}>Reset Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    headerTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, letterSpacing: 2 },
    scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

    heroCard: { alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.md },
    avatarRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.cardBackground, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 42, fontWeight: '600', color: theme.textPrimary },
    editIconBadge: { position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.background },
    userName: { fontSize: 24, fontWeight: '600', color: theme.textPrimary, marginBottom: spacing.xs, letterSpacing: -0.5 },
    goalBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: theme.brandProfile + '20', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.brandProfile + '50' },
    goalText: { fontSize: 12, color: theme.brandProfile, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },

    freeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: '#1F8F4320' },
    freeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    freeTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    freeSubtitle: { fontSize: 12, color: theme.textSecondary, fontWeight: '400' },

    menu: { backgroundColor: theme.cardBackground, borderRadius: 16, marginBottom: spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.border },
    menuIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderWidth: 1, borderColor: theme.border },
    menuLabel: { flex: 1, fontSize: 14, color: theme.textPrimary, fontWeight: '500', letterSpacing: 0.5 },

    themeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.cardBackground, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    themeInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    themeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    themeTitle: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
    themeSubtitle: { fontSize: 12, color: theme.textSecondary, fontWeight: '400' },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, marginBottom: spacing.lg },
    logoutText: { fontSize: 14, color: '#EF4444', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2 },

    footerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        paddingBottom: spacing.xl,
    },
    builtByText: {
        fontSize: 11,
        color: theme.textSecondary,
        fontWeight: '500',
        letterSpacing: 1,
    },
    devLink: {
        fontSize: 11,
        color: theme.brandAI || '#06B6D4',
        fontWeight: '700',
        textDecorationLine: 'underline',
        letterSpacing: 1,
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: theme.cardBackground, borderRadius: 24, padding: spacing.xl, width: '85%', maxWidth: 400, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    modalTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
    modalMessage: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: spacing.lg, fontWeight: '400' },
    modalButtons: { flexDirection: 'row', gap: spacing.md, width: '100%' },
    modalBtn: { flex: 1, paddingVertical: spacing.lg, borderRadius: 12, alignItems: 'center' },
    modalBtnCancel: { backgroundColor: '#222222', borderWidth: 1, borderColor: theme.border },
    modalBtnConfirm: { backgroundColor: '#EF4444' },
    modalBtnCancelText: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, textTransform: 'uppercase' },
    modalBtnConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
});


export default ProfileScreen;
