import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { adminApi } from '../services/api';

const AdminDashboardScreen = ({ navigation }) => {
    const { theme, isDarkMode } = useTheme();
    const { userData } = useUser();
    const [stats, setStats] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usersExpanded, setUsersExpanded] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getStats();
            if (data.success) {
                setStats(data.stats);
                setActiveUsers(data.activeUsers);
            }
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!userData?.isAdmin) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.unauthorized}>
                    <Ionicons name="shield-half-outline" size={64} color={theme.error} />
                    <Text style={[styles.errorText, { color: theme.error }]}>UNAUTHORIZED ACCESS</Text>
                    <Text style={[styles.errorSub, { color: theme.textSecondary }]}>This area is strictly for verified TrueFit Administrators.</Text>
                    <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.cardBackground }]} onPress={() => navigation.goBack()}>
                        <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>Return to Safety</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const adminStats = [
        { label: 'TOTAL USERS', value: stats?.totalUsers || '0', icon: 'people', color: theme.brandWorkout },
        { label: 'ACTIVE TODAY', value: stats?.activeToday || '0', icon: 'pulse', color: theme.success },
        { label: 'WORKOUTS LOGGED', value: stats?.totalWorkouts || '0', icon: 'barbell', color: theme.brandNutrition },
        { label: 'SYSTEM HEALTH', value: stats?.systemHealth || '100%', icon: 'server-outline', color: theme.primary },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 40 : 60 }]}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>ADMIN PORTAL</Text>
                    <View style={styles.authBadge}>
                        <View style={[styles.authDot, { backgroundColor: theme.success }]} />
                        <Text style={[styles.authText, { color: theme.success }]}>Authenticated</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.headerBtn} onPress={fetchStats}>
                    <Ionicons name="refresh" size={20} color={theme.textMuted} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {loading && !stats ? (
                    <View style={{ paddingVertical: 100 }}>
                        <ActivityIndicator color={theme.primary} size="large" />
                    </View>
                ) : (
                    <>
                        <View style={styles.welcomeCard}>
                            <View style={styles.welcomeInfo}>
                                <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>Welcome back,</Text>
                                <Text style={[styles.adminName, { color: theme.textPrimary }]}>{userData.name || 'Superadmin'}</Text>
                                <Text style={[styles.adminEmail, { color: theme.primary }]}>{userData.email || userData.phoneNumber}</Text>
                            </View>
                            <View style={[styles.shieldIcon, { backgroundColor: theme.primary + '20' }]}>
                                <Ionicons name="shield-checkmark" size={32} color={theme.primary} />
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Platform Overview</Text>

                        <View style={styles.statsGrid}>
                            {adminStats.map((stat, i) => (
                                <View key={i} style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                    <View style={[styles.statIconBadge, { backgroundColor: stat.color + '20' }]}>
                                        <Ionicons name={stat.icon} size={20} color={stat.color} />
                                    </View>
                                    <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stat.value}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => setUsersExpanded(!usersExpanded)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 0, marginTop: 0 }]}>Active Users Today ({activeUsers.length})</Text>
                            <Ionicons
                                name={usersExpanded ? 'chevron-up' : 'chevron-down'}
                                size={18}
                                color={theme.textSecondary}
                            />
                        </TouchableOpacity>
                        <View style={[styles.usersList, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            {activeUsers.length > 0 ? (
                                (usersExpanded ? activeUsers : activeUsers.slice(0, 3)).map((user, i, arr) => (
                                    <View key={i} style={[styles.userRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                                        <View style={[styles.userAvatar, { backgroundColor: theme.primary + '15' }]}>
                                            <Text style={{ color: theme.primary, fontWeight: '700' }}>{user.name.charAt(0).toUpperCase()}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.userNameList, { color: theme.textPrimary }]}>{user.name}</Text>
                                            <Text style={[styles.userEmailList, { color: theme.textMuted }]}>{user.email}</Text>
                                        </View>
                                        <Text style={[styles.userTimeText, { color: theme.success }]}>Active</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: theme.textMuted, textAlign: 'center', padding: 20 }}>No user activity tracked yet today.</Text>
                            )}
                            {!usersExpanded && activeUsers.length > 3 && (
                                <TouchableOpacity
                                    style={styles.showMoreBtn}
                                    onPress={() => setUsersExpanded(true)}
                                >
                                    <Text style={[styles.showMoreText, { color: theme.primary }]}>Show {activeUsers.length - 3} more users</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quick Actions</Text>

                        <View style={styles.actionsList}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                <View style={[styles.actionIcon, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="megaphone-outline" size={22} color={theme.primary} />
                                </View>
                                <View style={styles.actionInfo}>
                                    <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>Push Notification</Text>
                                    <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>Send an alert to all active users</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                <View style={[styles.actionIcon, { backgroundColor: theme.warning + '15' }]}>
                                    <Ionicons name="build-outline" size={22} color={theme.warning} />
                                </View>
                                <View style={styles.actionInfo}>
                                    <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>Manage App Content</Text>
                                    <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>Edit exercises, meals, and plans</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    unauthorized: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    errorText: { fontSize: 24, fontWeight: '900', marginTop: 16, letterSpacing: 2 },
    errorSub: { fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },
    backBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
    backBtnText: { fontSize: 16, fontWeight: '700' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
    headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitleContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    authBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    authDot: { width: 6, height: 6, borderRadius: 3, shadowColor: '#10B981', shadowOpacity: 0.5, shadowRadius: 4 },
    authText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },

    scroll: { padding: 20, paddingBottom: 100 },

    welcomeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: 20, borderRadius: 16, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
    welcomeInfo: { flex: 1 },
    welcomeText: { fontSize: 14, fontWeight: '500' },
    adminName: { fontSize: 24, fontWeight: '700', marginVertical: 4 },
    adminEmail: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
    shieldIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },

    sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16, marginTop: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 16 },
    showMoreBtn: { paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#2A2A2A' },
    showMoreText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    statCard: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'flex-start' },
    statIconBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

    usersList: { borderRadius: 16, borderWidth: 1, padding: 8, marginBottom: 24 },
    userRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
    userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    userNameList: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    userEmailList: { fontSize: 11, fontWeight: '400' },
    userTimeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    actionsList: { gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
    actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    actionInfo: { flex: 1 },
    actionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    actionDesc: { fontSize: 12, fontWeight: '400' },
});

export default AdminDashboardScreen;
