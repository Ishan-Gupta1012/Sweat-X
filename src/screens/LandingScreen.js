import React, { useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Animated,
    Dimensions,
    Platform,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { userData } = useUser();

    // Premium Animation Refs
    const bgScale = useRef(new Animated.Value(1)).current;
    
    const ring1Scale = useRef(new Animated.Value(0.8)).current;
    const ring1Opacity = useRef(new Animated.Value(0)).current;

    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(20)).current;
    
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;
    const buttonTranslateY = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Continuous, extremely slow cinematic zoom (no bounce back)
        Animated.timing(bgScale, {
            toValue: 1.2,
            duration: 40000,
            useNativeDriver: true,
        }).start();

        // Fluid, staggered entrance animation for all elements
        Animated.stagger(400, [
            // 1. Logo fades and scales in gracefully
            Animated.parallel([
                Animated.timing(ring1Opacity, { 
                    toValue: 1, 
                    duration: 1200, 
                    useNativeDriver: true 
                }),
                Animated.spring(ring1Scale, { 
                    toValue: 1, 
                    friction: 8,
                    tension: 20,
                    useNativeDriver: true 
                }),
            ]),
            
            // 2. Brand text slides up smoothly
            Animated.parallel([
                Animated.timing(textOpacity, { 
                    toValue: 1, 
                    duration: 1000, 
                    useNativeDriver: true 
                }),
                Animated.spring(textTranslateY, { 
                    toValue: 0, 
                    friction: 9,
                    tension: 30,
                    useNativeDriver: true 
                }),
            ]),
            
            // 3. Tagline fades in softly
            Animated.timing(taglineOpacity, { 
                toValue: 1, 
                duration: 800, 
                useNativeDriver: true 
            }),
            
            // 4. Button glides up into place
            Animated.parallel([
                Animated.timing(buttonOpacity, { 
                    toValue: 1, 
                    duration: 800, 
                    useNativeDriver: true 
                }),
                Animated.spring(buttonTranslateY, { 
                    toValue: 0, 
                    friction: 7, 
                    tension: 40,
                    useNativeDriver: true 
                }),
            ])
        ]).start();
    }, []);

    const handleBegin = () => {
        if (userData?.onboardingComplete) {
            navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
        } else {
            navigation.navigate('SignUp');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Cinematic Moving Background */}
            <View style={styles.absoluteFill}>
                <Animated.Image 
                    source={require('../assets/gym_hero.jpg')}
                    style={[
                        styles.absoluteFill,
                        { transform: [{ scale: bgScale }] }
                    ]}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.75)', '#000000']}
                    style={styles.absoluteFill}
                />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerStage}>
                    
                    {/* Premium App Logo */}
                    <Animated.View style={[
                        styles.logoContainer,
                        { 
                            opacity: ring1Opacity,
                            transform: [{ scale: ring1Scale }] 
                        }
                    ]}>
                        <Image 
                            source={require('../assets/sweatx_logo_transparent.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    {/* Majestic Typography */}
                    <Animated.View style={{ 
                        opacity: textOpacity, 
                        transform: [{ translateY: textTranslateY }],
                        alignItems: 'center'
                    }}>
                        <Text style={styles.brandText}>SWEAT-X</Text>
                    </Animated.View>

                    <Animated.View style={{ opacity: taglineOpacity, marginTop: 12 }}>
                        <Text style={styles.taglineText}>OPTIMIZE EVERY MOVEMENT</Text>
                    </Animated.View>

                </View>

                {/* Premium Pill Button */}
                <Animated.View style={[
                    styles.bottomSection,
                    { 
                        opacity: buttonOpacity,
                        transform: [{ translateY: buttonTranslateY }] 
                    }
                ]}>
                    <TouchableOpacity 
                        style={styles.premiumButton} 
                        onPress={handleBegin}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.05)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.premiumButtonGradient}
                        >
                            <Text style={styles.premiumButtonText}>BEGIN TRANSFORMATION</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    centerStage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    logoContainer: {
        width: width * 0.45,
        height: width * 0.45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    brandText: {
        fontSize: 38,
        fontWeight: '300', // Very light, sleek typography
        color: '#FFFFFF',
        letterSpacing: 8, // Extremely wide tracking for premium feel
        textTransform: 'uppercase',
    },
    taglineText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666666',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    bottomSection: {
        width: '100%',
        paddingHorizontal: 32,
        paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    },
    premiumButton: {
        width: '100%',
        height: 60,
        borderRadius: 30,
        // Neon green glow effect
        shadowColor: '#52B788',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(82, 183, 136, 0.5)', // Subtle green border
    },
    premiumButtonGradient: {
        flex: 1,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
});

export default LandingScreen;
