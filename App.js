import React, { useEffect, useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './AuthContext';
import LoginScreen from './LoginScreen';
import Splash from './SplashScreen';
import DashboardScreen from './DashboardScreen';
import ProfileScreen from './ProfileScreen';
import AttendanceScreen from './AttendanceScreen';
import AttendanceRecordsScreen from './AttendanceRecordsScreen';

const Stack = createStackNavigator();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  useEffect(() => {
    const prepare = async () => {
      try {
        // Simulate loading (e.g., 3 seconds) or add initialization logic here
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn('Splash screen error:', e);
      } finally {
        // Mark app as ready; actual hide happens on layout
        setAppIsReady(true);
      }
    };

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    // Keep native Splash visible while JS loads
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen
            name="Splash"
            component={Splash}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Attendance"
            component={AttendanceScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AttendanceRecords"
            component={AttendanceRecordsScreen}
            options={{ headerShown: false }}
          />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
      <Toast />
    </View>
  );
}