import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from './config';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthContext';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const { setAuth } = useAuth();

  const requestRuntimePermissions = async () => {
    try {
      const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (camStatus !== 'granted') {
        Toast.show({ type: 'error', text1: 'Camera permission denied' });
      }
      if (locStatus !== 'granted') {
        Toast.show({ type: 'error', text1: 'Location permission denied' });
      }
    } catch {}
  };

  const handleLogin = async () => {
    try {
      setError('');
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false) {
        const message = data?.message || 'Login failed. Please try again.';
        setError(message);
        Toast.show({ type: 'error', text1: 'Login failed', text2: message });
        return;
      }

      if (data?.accessToken && data?.refreshToken) {
        setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user || null });
      }
      await requestRuntimePermissions();
      Toast.show({ type: 'success', text1: 'Welcome back!' });
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (e) {
      setError('Network error. Please check your connection or server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
          <View style={styles.heroContainer}>
            <Image
              source={require('./assets/login image.jpg')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.contentWrapper}>
        <Text style={styles.title}>
          <Text style={styles.titlePrimary}>Welcome</Text>
          <Text style={styles.titleAccent}> back</Text>
        </Text>
        <Text style={styles.subtitle}>Please sign in to continue</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Log In'}</Text>
          </TouchableOpacity>
        </View>
          </View>
          <StatusBar style="auto" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  heroContainer: {
    height: 240,
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: '#0A66FF',
  },
  heroImage: {
    width: '90%',
    height: '90%',
    opacity: 0.95,
  },
  contentWrapper: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'left',
    letterSpacing: 0.3,
  },
  titlePrimary: {
    color: '#0A66FF',
  },
  titleAccent: {
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#4B5563',
  },
  form: {
    marginTop: 28,
    gap: 12,
  },
  input: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    color: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  button: {
    backgroundColor: '#0A66FF',
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  errorText: {
    color: '#DC2626',
    marginTop: 4,
    marginBottom: 4,
  },
});