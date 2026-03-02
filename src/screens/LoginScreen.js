import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Animated,
    ScrollView,
    Dimensions,
    Platform,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, colors } from '../constants/colors';
import PrimaryButton from '../components/PrimaryButton';
import InputField from '../components/InputField';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { login } = useUser();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Background Orbs
    const orb1Anim = useRef(new Animated.Value(0)).current;
    const orb2Anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance Animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: Platform.OS !== 'web',
            }),
        ]).start();

        // Loop Animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
            ])
        ).start();

        const createLoop = (anim, duration) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: 1, duration, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(anim, { toValue: 0, duration, useNativeDriver: Platform.OS !== 'web' }),
                ])
            ).start();
        };

        createLoop(orb1Anim, 8000);
        createLoop(orb2Anim, 12000);
    }, []);

    const handleLogin = async () => {
        if (!identifier || !password) {
            Alert.alert('Incomplete Entry', 'Please provide both your Access ID and Security Key.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await login({ identifier, password });
            console.log('🔐 Login result:', result);
            console.log('🔐 onboardingComplete:', result.user?.onboardingComplete);
            if (result.success) {
                if (result.user.onboardingComplete) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'MainApp' }],
                    });
                } else {
                    navigation.navigate('OnboardingStep1');
                }
            } else {
                Alert.alert('Auth Failed', result.error || 'Invalid credentials');
            }
        } catch (error) {
            Alert.alert('Error', 'Communication with HQ failed. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Background Layer */}
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: theme.background }} />

            {/* Tactical Orbs */}
            <Animated.View style={[
                styles.orb,
                {
                    top: '15%',
                    left: '-10%',
                    backgroundColor: theme.primary + '10',
                    transform: [
                        { translateY: orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) },
                        { scale: orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }
                    ]
                }
            ]} />
            <Animated.View style={[
                styles.orb,
                {
                    bottom: '10%',
                    right: '-5%',
                    backgroundColor: theme.primary + '08',
                    transform: [
                        { translateX: orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) },
                        { scale: orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1] }) }
                    ]
                }
            ]} />

            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Brand Header */}
                    <Animated.View style={[
                        styles.headerSection,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}>
                        <Text style={styles.headerTagline}>INITIALIZE AUTHENTICATION</Text>
                        <Text style={styles.brandTitle}>Sweat-X</Text>
                        <Text style={styles.brandSubtitle}>PERFORMANCE TRACKING</Text>
                    </Animated.View>

                    {/* Login Tactical Card */}
                    <Animated.View style={[
                        styles.authCard,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardIndicator} />
                            <Text style={styles.cardTitle}>SECURE ENTRY</Text>
                        </View>

                        <InputField
                            label="USERNAME"
                            placeholder="Email or Phone"
                            value={identifier}
                            onChangeText={setIdentifier}
                            leftIcon={<Ionicons name="person-outline" size={20} color={theme.textMuted} />}
                            autoCapitalize="none"
                            style={{ marginBottom: spacing.xl }}
                        />

                        <InputField
                            label="PASSWORD"
                            placeholder="Enter Key"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={secureTextEntry}
                            leftIcon={<Ionicons name="shield-outline" size={20} color={theme.textMuted} />}
                            style={{ marginBottom: spacing.xl }}
                            rightIcon={
                                <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                                    <Ionicons name={secureTextEntry ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                                </TouchableOpacity>
                            }
                        />

                        <PrimaryButton
                            title="WORKOUT"
                            onPress={handleLogin}
                            loading={isLoading}
                            style={[styles.engageButton, { marginTop: spacing.sm }]}
                        />
                    </Animated.View>

                    {/* Register Hook */}
                    <Animated.View style={[
                        styles.footer,
                        { opacity: fadeAnim }
                    ]}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('SignUp')}
                            style={styles.footerRow}
                        >
                            <Text style={styles.footerText}>New here? </Text>
                            <Text style={styles.signUpLink}>SIGN UP</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0F12', // Deep Black background
    },
    // Orb styles removed as per design update
    // orb: {
    //     position: 'absolute',
    //     width: 300,
    //     height: 300,
    //     borderRadius: 150,
    //     filter: Platform.OS === 'web' ? 'blur(80px)' : undefined, // Blurred orbs as tactical lighting
    // },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: spacing.xl * 1.5,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        padding: 4,
        backgroundColor: 'rgba(255, 107, 0, 0.1)',
        marginBottom: spacing.lg,
    },
    logoGradient: {
        flex: 1,
        borderRadius: borderRadius.md - 2,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' ? {
            boxShadow: theme.isDark
                ? `0 4px 10px ${theme.primary}80`
                : `0 4px 10px rgba(0, 0, 0, 0.1)`,
        } : {
            shadowColor: theme.isDark ? theme.primary : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.isDark ? 0.5 : 0.1,
            shadowRadius: 10,
        }),
    },
    headerTagline: {
        fontSize: 10,
        fontWeight: '600', // Updated to semi-bold
        color: theme.primary, // Minimal accent
        letterSpacing: 3,
        marginBottom: spacing.xs,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    brandTitle: {
        fontSize: 48,
        fontWeight: '900', // Original ultra-thick weight
        color: theme.textPrimary,
        letterSpacing: 4,
    },
    brandSubtitle: {
        fontSize: 14,
        color: theme.primary, // Revert to Orange
        fontWeight: '800', // Original weight
        letterSpacing: 4,
        marginTop: 8,
    },
    authCard: {
        backgroundColor: theme.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : theme.border,
        ...(Platform.OS === 'web' ? {
            boxShadow: theme.isDark
                ? '0 12px 24px rgba(0, 0, 0, 0.5)'
                : '0 12px 24px rgba(0, 0, 0, 0.05)',
        } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: theme.isDark ? 0.5 : 0.1,
            shadowRadius: 24,
            elevation: theme.isDark ? 10 : 4,
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
        gap: spacing.sm,
    },
    cardIndicator: {
        width: 4,
        height: 16,
        backgroundColor: theme.primary,
        borderRadius: 2,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.textPrimary,
        letterSpacing: 2,
    },
    engageButton: {
        marginTop: spacing.md,
        height: 60,
    },
    authButton: {
        height: 60, // Original height
        borderRadius: 14, // Original radius
        marginTop: spacing.md,
        overflow: 'hidden',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    authButtonActive: {
        opacity: 0.8,
    },
    footerStatus: {
        height: 1,
        backgroundColor: theme.divider,
        marginVertical: spacing.xl,
    },
    footer: {
        alignItems: 'center',
        marginTop: spacing.xl * 1.5,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        color: theme.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    signUpLink: {
        color: theme.primary,
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    forgotPasswordBtn: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
    forgotPasswordText: {
        color: theme.textMuted,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
});

export default LoginScreen;

