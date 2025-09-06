import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, TextInput, Modal, ScrollView } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import { useNavigation } from '@react-navigation/native';

const PURPOSE_OPTIONS = [
  'Check In',
  'Check Out',
  'Site Visit',
  'Client Meeting',
  'Office Visit',
  'New Site Survey',
  'Official Tour',
  'Others',
];

export default function AttendanceScreen() {
  const cameraRef = useRef(null);
  const navigation = useNavigation();
  const { auth } = useAuth();

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null); // { uri, base64 }
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [purposeOpen, setPurposeOpen] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [details, setDetails] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status: camStatus } = await Camera.getCameraPermissionsAsync();
        const { status: locStatus } = await Location.getForegroundPermissionsAsync();
        if (isMounted) {
          setHasCameraPermission(camStatus === 'granted');
          setHasLocationPermission(locStatus === 'granted');
        }
        if (isMounted && locStatus === 'granted') {
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
            setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          } catch {}
        }
      } catch {}
    })();
    return () => { isMounted = false; };
  }, []);

  const captureSelfie = async () => {
    try {
      if (!cameraRef.current) return;
      setCapturing(true);
      const result = await cameraRef.current.takePictureAsync({ 
        quality: 0.3, // Reduced quality
        base64: true,
        skipProcessing: true,
        isImageMirror: true,
        width: 800, // Limit max width
        height: 600 // Limit max height
      });
      setPhoto({ uri: result.uri, base64: result.base64 });
      if (hasLocationPermission) {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Camera error', text2: 'Unable to capture photo.' });
    } finally {
      setCapturing(false);
    }
  };

  const submitAttendance = async () => {
    try {
      if (!photo?.base64) {
        Toast.show({ type: 'error', text1: 'Missing selfie', text2: 'Please capture your selfie.' });
        return;
      }
      if (!coords) {
        Toast.show({ type: 'error', text1: 'Location required', text2: 'Enable location to continue.' });
        return;
      }
      if (!purpose) {
        Toast.show({ type: 'error', text1: 'Select purpose', text2: 'Please choose a purpose.' });
        return;
      }
      setSubmitting(true);
      // Compress and resize the image before sending
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { resize: { width: 600 } } // Resize to smaller width while maintaining aspect ratio
        ],
        {
          compress: 0.3, // Further compress the image
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );

      const payload = {
        image: `data:image/jpeg;base64,${manipResult.base64}`,
        location: JSON.stringify({ lat: coords.latitude, lng: coords.longitude }),
        locationName: 'Unknown',
        purpose,
        subPurpose: details || 'N/A',
        feedback: details || 'N/A',
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      };
      const res = await fetch(`${API_BASE_URL}/api/v1/user/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth?.accessToken || ''}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const message = data?.message || 'Attendance failed';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
        return;
      }
      Toast.show({ type: 'success', text1: 'Attendance marked' });
      navigation.navigate('AttendanceRecords');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Network error', text2: 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const disabledSubmit = submitting;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Mark Attendance</Text>
        {!photo ? (
          <View style={styles.cameraCard}>
            {hasCameraPermission === false ? (
              <View style={styles.center}> 
                <Text style={styles.errorText}>Camera permission denied</Text>
              </View>
            ) : hasCameraPermission === true ? (
              <CameraView 
                ref={cameraRef} 
                style={styles.camera} 
                facing="front"
                onCameraReady={() => setCameraReady(true)}
              />
            ) : (
              <View style={styles.center}><ActivityIndicator color="#0A66FF" /></View>
            )}
            <TouchableOpacity style={[styles.actionBtn, capturing && styles.btnDisabled]} onPress={captureSelfie} activeOpacity={0.85} disabled={capturing}>
              {capturing ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Capture Selfie</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewCard}>
            <Image source={{ uri: photo.uri }} style={styles.preview} />
            <View style={styles.rowBetween}>
              <TouchableOpacity style={[styles.secondaryBtn]} onPress={() => setPhoto(null)} activeOpacity={0.85}>
                <Text style={styles.secondaryText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryBtn]} onPress={() => setPurposeOpen(true)} activeOpacity={0.85}>
                <Text style={styles.secondaryText}>{purpose ? `Purpose: ${purpose}` : 'Select Purpose'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.label}>Details (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Add up to 50 characters"
            placeholderTextColor="#9CA3AF"
            maxLength={50}
            value={details}
            onChangeText={setDetails}
          />
          <Text style={styles.charCount}>{details.length}/50</Text>

          <View style={styles.coordsBox}>
            <Text style={styles.coordsLabel}>Coordinates</Text>
            <Text style={styles.coordsText}>
              {coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` : 'Fetching location...'}
            </Text>
          </View>

          <TouchableOpacity style={[styles.submitBtn, disabledSubmit && styles.btnDisabled]} onPress={submitAttendance} activeOpacity={0.85} disabled={disabledSubmit}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Attendance</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal transparent visible={purposeOpen} animationType="fade" onRequestClose={() => setPurposeOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Purpose</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {PURPOSE_OPTIONS.map((opt) => (
                <TouchableOpacity key={opt} style={styles.optionRow} onPress={() => { setPurpose(opt); setPurposeOpen(false); }}>
                  <Text style={[styles.optionText, purpose === opt && styles.optionActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setPurposeOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]} onPress={() => navigation.navigate('Dashboard')} activeOpacity={0.8}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { padding: 24, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  cameraCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3, marginBottom: 16 },
  camera: { width: '100%', height: 260 },
  actionBtn: { margin: 12, backgroundColor: '#0A66FF', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.7 },
  center: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#B91C1C', fontWeight: '600' },
  previewCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3, marginBottom: 16 },
  preview: { width: '100%', height: 260, borderRadius: 10, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#F9FAFB' },
  secondaryText: { color: '#111827', fontWeight: '700' },
  formCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  label: { color: '#6B7280', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', color: '#111827' },
  charCount: { textAlign: 'right', marginTop: 6, color: '#6B7280', fontSize: 12 },
  coordsBox: { marginTop: 12, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  coordsLabel: { color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  coordsText: { color: '#111827', fontWeight: '700' },
  submitBtn: { marginTop: 16, backgroundColor: '#0A66FF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '86%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  optionRow: { paddingVertical: 12 },
  optionText: { color: '#111827', fontWeight: '600' },
  optionActive: { color: '#0A66FF' },
  modalClose: { marginTop: 10, alignItems: 'center' },
  modalCloseText: { color: '#0A66FF', fontWeight: '700' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderTopWidth: 2, borderTopColor: '#0A66FF' },
  tabText: { color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#0A66FF' },
});


