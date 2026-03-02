import 'react-native-gesture-handler';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  // On web, wrap in a mobile-like container
  if (Platform.OS === 'web') {
    return (
      <ThemeProvider>
        <UserProvider>
          {/* Inject global styles for Web to fix browser autofill issues */}
          <style dangerouslySetInnerHTML={{
            __html: `
            * {
                outline: none !important;
            }
            input:-webkit-autofill,
            input:-webkit-autofill:hover, 
            input:-webkit-autofill:focus, 
            input:-webkit-autofill:active{
                -webkit-box-shadow: 0 0 0 30px #1C1C1E inset !important;
                -webkit-text-fill-color: white !important;
                transition: background-color 5000s ease-in-out 0s;
            }
          `}} />
          <View style={styles.webContainer}>
            <View style={styles.mobileFrame}>
              <SafeAreaProvider>
                <AppNavigator />
              </SafeAreaProvider>
            </View>
          </View>
        </UserProvider>
      </ThemeProvider>
    );
  }

  // On mobile, render normally
  return (
    <ThemeProvider>
      <UserProvider>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  mobileFrame: {
    width: 390, // iPhone 14 width
    height: 844, // iPhone 14 height
    maxHeight: '95vh',
    backgroundColor: '#0D0D0D',
    borderRadius: 40,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '8px solid #1a1a1a',
  },
});
