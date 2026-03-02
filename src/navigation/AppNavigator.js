import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

// Screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import OnboardingStep1 from '../screens/OnboardingStep1';
import OnboardingStep2 from '../screens/OnboardingStep2';
import SetupLoadingScreen from '../screens/SetupLoadingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WorkoutSelectionScreen from '../screens/WorkoutSelectionScreen';
import WorkoutSessionScreen from '../screens/WorkoutSessionScreen';
import AIChatScreen from '../screens/AIChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddMealScreen from '../screens/AddMealScreen';
import BodyMetricsScreen from '../screens/BodyMetricsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import NutritionLogScreen from '../screens/NutritionLogScreen';
import WorkoutHistoryScreen from '../screens/WorkoutHistoryScreen';
import FoodSearchScreen from '../screens/FoodSearchScreen';
import CreateMealScreen from '../screens/CreateMealScreen';
import BeginnerSetupScreen from '../screens/BeginnerSetupScreen';
import CreateCustomSplitScreen from '../screens/CreateCustomSplitScreen';
import SplitExerciseEditorScreen from '../screens/SplitExerciseEditorScreen';
import AddExerciseDetailsScreen from '../screens/AddExerciseDetailsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { theme } = useTheme();
    const { userData, isLoading } = useUser();

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={userData.onboardingComplete ? "MainApp" : "Landing"}
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.background },
                    animation: 'slide_from_right',
                }}
            >
                {/* Onboarding Flow */}
                <Stack.Screen name="Landing" component={LandingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="OnboardingStep1" component={OnboardingStep1} />
                <Stack.Screen name="OnboardingStep2" component={OnboardingStep2} />
                <Stack.Screen
                    name="SetupLoading"
                    component={SetupLoadingScreen}
                    options={{ gestureEnabled: false }}
                />

                {/* Main App */}
                <Stack.Screen
                    name="MainApp"
                    component={DashboardScreen}
                    options={{ gestureEnabled: false }}
                />

                <Stack.Screen
                    name="WorkoutSelection"
                    component={WorkoutSelectionScreen}
                />

                <Stack.Screen
                    name="WorkoutSession"
                    component={WorkoutSessionScreen}
                    options={{
                        animation: 'slide_from_bottom',
                        gestureEnabled: false,
                    }}
                />

                <Stack.Screen
                    name="AddExerciseDetails"
                    component={AddExerciseDetailsScreen}
                    options={{
                        animation: 'slide_from_bottom',
                    }}
                />

                <Stack.Screen
                    name="AIChat"
                    component={AIChatScreen}
                    options={{
                        animation: 'slide_from_bottom',
                    }}
                />

                <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                />

                <Stack.Screen
                    name="AddMeal"
                    component={AddMealScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />

                <Stack.Screen
                    name="BodyMetrics"
                    component={BodyMetricsScreen}
                />

                <Stack.Screen
                    name="Goals"
                    component={GoalsScreen}
                />

                <Stack.Screen
                    name="NutritionLog"
                    component={NutritionLogScreen}
                />

                <Stack.Screen
                    name="WorkoutHistory"
                    component={WorkoutHistoryScreen}
                />

                <Stack.Screen
                    name="FoodSearch"
                    component={FoodSearchScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />

                <Stack.Screen
                    name="CreateMeal"
                    component={CreateMealScreen}
                />
                <Stack.Screen
                    name="BeginnerSetup"
                    component={BeginnerSetupScreen}
                />
                <Stack.Screen
                    name="CreateCustomSplit"
                    component={CreateCustomSplitScreen}
                />
                <Stack.Screen
                    name="SplitExerciseEditor"
                    component={SplitExerciseEditorScreen}
                />
                <Stack.Screen
                    name="AdminDashboard"
                    component={AdminDashboardScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
