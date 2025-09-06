import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen({ navigation }) {
  const handleNext = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundAccentTop} />
      <View style={styles.backgroundAccentBottom} />
      <View style={styles.centerContent}>
        <Image
          source={require('./assets/worktrack.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>
          <Text style={styles.taglinePrimary}>Simplifying</Text>
          <Text style={styles.taglineAccent}> field work</Text>
        </Text>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundAccentTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#E8F0FF',
  },
  backgroundAccentBottom: {
    position: 'absolute',
    bottom: -50,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: '80%',
    height: 200,
  },
  tagline: {
    marginTop: 18,
    fontSize: 22,
    letterSpacing: 0.3,
    fontWeight: '800',
  },
  taglinePrimary: {
    color: '#0A66FF',
  },
  taglineAccent: {
    color: '#111827',
  },
  nextButton: {
    margin: 24,
    backgroundColor: '#0A66FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  nextText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});


