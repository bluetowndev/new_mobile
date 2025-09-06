import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Image, TouchableOpacity } from 'react-native';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function AttendanceRecordsScreen() {
  const { auth } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [distanceById, setDistanceById] = useState({}); // { [attendanceId]: { distance, isFirst } }

  const fetchRecords = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/user/viewAttendance`, {
        headers: { Authorization: `Bearer ${auth?.accessToken || ''}` },
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        setError(data?.message || 'Failed to fetch records');
      } else {
        setRecords(Array.isArray(data?.data) ? data.data : []);
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Compute unique dates and fetch per-date distances from backend
  useEffect(() => {
    const run = async () => {
      try {
        const byDate = new Map();
        for (const r of records) {
          const d = new Date(r.timestamp);
          const dateKey = d.toISOString().split('T')[0];
          if (!byDate.has(dateKey)) byDate.set(dateKey, true);
        }
        const newDistances = {};
        for (const dateKey of byDate.keys()) {
          const res = await fetch(`${API_BASE_URL}/api/v1/user/calculateDistance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.accessToken || ''}` },
            body: JSON.stringify({ date: dateKey }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.success && Array.isArray(data.pointToPointDistances)) {
            for (const p of data.pointToPointDistances) {
              if (p && typeof p.attendanceId !== 'undefined') {
                newDistances[p.attendanceId] = { distance: p.distance, isFirst: !!p.isFirst };
              }
            }
          }
        }
        setDistanceById(newDistances);
      } catch {}
    };
    if (records.length) run();
  }, [records, auth?.accessToken]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={{ color: '#9CA3AF' }}>No Image</Text>
        </View>
      )}
      <View style={styles.row}><Text style={styles.label}>Location</Text><Text style={styles.value}>{item.locationName}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Lat, Lng</Text><Text style={styles.value}>{item.lat}, {item.lng}</Text></View>
      {distanceById[item.id] && (
        <View style={styles.row}>
          <Text style={styles.label}>Distance</Text>
          <Text style={styles.value}>
            {distanceById[item.id].isFirst ? '0.00 km (first record)' :
              (distanceById[item.id].distance === 'N/A' ? 'N/A' : `${distanceById[item.id].distance} km`)}
          </Text>
        </View>
      )}
      <View style={styles.row}><Text style={styles.label}>Purpose</Text><Text style={styles.value}>{item.purpose}{item.subPurpose && item.subPurpose !== 'N/A' ? ` • ${item.subPurpose}` : ''}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Timestamp</Text><Text style={styles.value}>{new Date(item.timestamp).toLocaleString()}</Text></View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Records</Text>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#0A66FF" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.tab]} onPress={() => navigation.navigate('Dashboard')} activeOpacity={0.8}>
          <Text style={styles.tabText}>Home</Text>
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
  header: { paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#B91C1C' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  photo: { width: '100%', height: 160, borderRadius: 10, marginBottom: 10 },
  photoPlaceholder: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#6B7280', fontWeight: '600' },
  value: { color: '#111827', fontWeight: '700', marginLeft: 6, flexShrink: 1, textAlign: 'right' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { color: '#6B7280', fontWeight: '600' },
});


