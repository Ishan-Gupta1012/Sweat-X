import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Dimensions
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

const SignUpScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { register } = useUser();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    // Background Orbs
    const orb1Anim = useRef(new Animated.Value(0)).current;
    const orb2Anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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
            })
        ]).start();

        const createLoop = (anim, duration) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: 1, duration, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(anim, { toValue: 0, duration, useNativeDriver: Platform.OS !== 'web' }),
                ])
            ).start();
        };

        createLoop(orb1Anim, 10000);
        createLoop(orb2Anim, 15000);
    }, []);

    const handleSignUp = async () => {
        if (!name || !email || !phone || !password) {
            Alert.alert('Incomplete Profile', 'All fields are required for enlistment.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await register({ name, email, phone, password });
            console.log('Register result:', result);

            if (result.success) {
                // User is now registered and logged in, go directly to onboarding
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'OnboardingStep1' }],
                });
            } else {
                // Check if it's a duplicate account error
                const errorMsg = result.error || 'Registration failed. Please try again.';
                console.log('Registration error:', errorMsg);

                if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('registered')) {
                    Alert.alert(
                        'Account Already Exists',
                        'An account with this email or phone number is already registered. Would you like to login instead?',
                        [
                            { text: 'Try Again', style: 'cancel' },
                            { text: 'Go to Login', onPress: () => navigation.navigate('Login') }
                        ]
                    );
                } else {
                    Alert.alert('Registration Failed', errorMsg);
                }
            }
        } catch (error) {
            console.error('SignUp error:', error);
            Alert.alert('Connection Error', 'Unable to connect to server. Please check your internet connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <LinearGradient
                colors={['#000000', '#0A0A0A', '#050505']}
                style={StyleSheet.absoluteFill}
            />

            {/* Tactical Orbs */}
            <Animated.View style={[
                styles.orb,
                {
                    top: '5%',
                    right: '-15%',
                    backgroundColor: theme.primary + '08',
                    transform: [
                        { translateY: orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }) },
                        { scale: orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [1.3, 1] }) }
                    ]
                }
            ]} />
            <Animated.View style={[
                styles.orb,
                {
                    bottom: '20%',
                    left: '-10%',
                    backgroundColor: theme.primary + '06',
                    transform: [
                        { translateX: orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
                        { scale: orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }
                    ]
                }
            ]} />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header Navigation */}
                        <Animated.View style={[
                            styles.navHeader,
                            { opacity: fadeAnim }
                        ]}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.navTitle}>ENLISTMENT</Text>
                            <View style={{ width: 40 }} />
                        </Animated.View>

                        {/* Title Section */}
                        <Animated.View style={[
                            styles.heroSection,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}>
                            <Text style={styles.heroSubtitle}>ACCESS PROTOCOL</Text>
                            <Text style={styles.heroTitle}>JOIN THE{"\n"}ELITE</Text>
                        </Animated.View>

                        {/* Form Tactical Card */}
                        <Animated.View style={[
                            styles.formCard,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}>
                            <View style={styles.cardIndicatorRow}>
                                <View style={styles.indicator} />
                                <Text style={styles.indicatorText}>PHASE 01: IDENTITY</Text>
                            </View>

                            <InputField
                                label="FULL NAME"
                                placeholder="Ishan Gupta"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                leftIcon={<Ionicons name="person-outline" size={20} color={theme.textMuted} />}
                                style={{ marginBottom: spacing.md }}
                            />

                            <InputField
                                label="EMAIL ADDRESS"
                                placeholder="name@hq.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                leftIcon={<Ionicons name="mail-outline" size={20} color={theme.textMuted} />}
                                style={{ marginBottom: spacing.md }}
                            />

                            <InputField
                                label="PHONE CONTACT"
                                placeholder="+91 XXXX XXXX"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                leftIcon={<Ionicons name="call-outline" size={20} color={theme.textMuted} />}
                                style={{ marginBottom: spacing.md }}
                            />

                            <InputField
                                label="PASSWORD"
                                placeholder="Min. 6 Characters"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={secureTextEntry}
                                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />}
                                style={{ marginBottom: spacing.md }}
                                rightIcon={
                                    <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                                        <Ionicons name={secureTextEntry ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                                    </TouchableOpacity>
                                }
                            />

                            <PrimaryButton
                                title="START TRAINING"
                                onPress={handleSignUp}
                                loading={isLoading}
                                style={styles.signUpButton}
                            />
                        </Animated.View>

                        {/* Footer */}
                        <Animated.View style={[
                            styles.footer,
                            { opacity: fadeAnim }
                        ]}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Login')}
                                style={styles.footerRow}
                            >
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <Text style={styles.loginLink}>LOGIN</Text>
                            </TouchableOpacity>
                        </Animated.View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    orb: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        filter: Platform.OS === 'web' ? 'blur(100px)' : undefined,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.textMuted,
        letterSpacing: 4,
    },
    heroSection: {
        marginVertical: spacing.md,
    },
    heroSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.primary,
        letterSpacing: 3,
        marginBottom: spacing.xs,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.textPrimary,
        lineHeight: 40,
        letterSpacing: 2,
    },
    formCard: {
        backgroundColor: theme.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
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
    cardIndicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    indicator: {
        width: 4,
        height: 16,
        backgroundColor: theme.primary,
        borderRadius: 2,
    },
    indicatorText: {
        fontSize: 11,
        fontWeight: '800',
        color: theme.textPrimary,
        letterSpacing: 2,
    },
    signUpButton: {
        marginTop: spacing.md,
        height: 60,
    },
    footer: {
        alignItems: 'center',
        marginTop: spacing.xl,
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
    loginLink: {
        color: theme.primary,
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
});

export default SignUpScreen;

