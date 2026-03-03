import React, { useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ImageBackground,
    Animated,
    Dimensions,
    Platform,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, colors } from '../constants/colors';
import PrimaryButton from '../components/PrimaryButton';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { userData } = useUser();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const bannerScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <View style={styles.bgWrapper}>
                <ImageBackground
                    source={require('../../assets/gym_hero.png')}
                    style={styles.fullScreenBg}
                    resizeMode="cover"
                >
                    {/* Multi-layered Gradient for Depth */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', theme.background]}
                        style={styles.gradientOverlay}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(6,182,212,0.05)', 'transparent']}
                        style={styles.accentGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </ImageBackground>
            </View>

            <SafeAreaView style={styles.content}>
                {/* Header Top */}
                <Animated.View style={[
                    styles.header,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.appName}>Sweat-X</Text>
                        <View style={styles.accentLine} />
                    </View>
                    <Text style={styles.subtitle}>ELITE PERFORMANCE TRACKER</Text>
                </Animated.View>


                {/* Content Bottom */}
                <Animated.View style={[
                    styles.bottomSection,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <View style={styles.taglineWrapper}>
                        <View style={styles.taglineLine} />
                        <Text style={styles.taglineText}>FORGED FOR FOCUS</Text>
                        <View style={styles.taglineLine} />
                    </View>

                    <Text
                        style={styles.mainHeadline}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        Break Your <Text style={styles.highlightText}>Boundaries.</Text>
                    </Text>

                    <PrimaryButton
                        title="Begin Transformation"
                        onPress={() => {
                            if (userData?.onboardingComplete) {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'MainApp' }],
                                });
                            } else {
                                navigation.navigate('SignUp');
                            }
                        }}
                        style={styles.ctaButton}
                        icon={<Ionicons name="sparkles-outline" size={20} color="#fff" />}
                    />

                    <View style={styles.footer}>
                        <Ionicons name="shield-checkmark" size={14} color={theme.textMuted} />
                        <Text style={styles.footerText}>
                            100% FREE • NO ADS • FOREVER
                        </Text>
                    </View>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    bgWrapper: {
        ...StyleSheet.absoluteFillObject,
    },
    fullScreenBg: {
        flex: 1,
        width: '100%',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    accentGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: Platform.OS === 'web' ? spacing.xxl : spacing.xl,
        paddingBottom: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginTop: height * 0.05,
    },
    logoContainer: {
        alignItems: 'center',
    },
    appName: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 10,
        textAlign: 'center',
        textShadowColor: 'rgba(6, 182, 212, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    subtitle: {
        color: theme.primary,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 4,
        marginTop: spacing.sm,
        opacity: 0.9,
    },
    accentLine: {
        width: 60,
        height: 4,
        backgroundColor: theme.primary,
        marginTop: spacing.xs,
        borderRadius: borderRadius.full,
    },
    bottomSection: {
        width: '100%',
        paddingBottom: spacing.lg,
    },
    taglineWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    taglineLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    taglineText: {
        color: theme.textSecondary,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
    },
    mainHeadline: {
        color: theme.isDark ? '#FFFFFF' : theme.textPrimary,
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 48,
        marginBottom: spacing.xl,
    },
    highlightText: {
        color: theme.primary,
    },
    ctaButton: {
        height: 64, // Taller for premium feel
        borderRadius: borderRadius.lg,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    ctaButtonActive: {
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.8,
        shadowRadius: 24,
        elevation: 20,
        transform: [{ scale: 0.98 }]
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        gap: spacing.xs,
        opacity: 0.6,
    },
    footerText: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.textMuted,
        letterSpacing: 2,
    },
});

export default LandingScreen;
