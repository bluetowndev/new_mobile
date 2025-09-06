import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import { useAuth } from './AuthContext';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from './config';
import { MaterialIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { clearAuth, auth } = useAuth();
  const navigation = useNavigation();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleLogout = () => {
    clearAuth();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

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
        setRecords([]);
      } else {
        setRecords(Array.isArray(data?.data) ? data.data : []);
      }
    } catch (e) {
      setError('Network error. Please try again.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const dateKey = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);
  const dailyRecords = useMemo(() => {
    return records.filter(r => (new Date(r.timestamp)).toISOString().split('T')[0] === dateKey);
  }, [records, dateKey]);

  const changeDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

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
      <View style={styles.row}><Text style={styles.label}>Purpose</Text><Text style={styles.value}>{item.purpose}{item.subPurpose && item.subPurpose !== 'N/A' ? ` • ${item.subPurpose}` : ''}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Time</Text><Text style={styles.value}>{new Date(item.timestamp).toLocaleTimeString()}</Text></View>
    </View>
  );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>Today</Text></View>
            <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}><Text style={[styles.badgeText, { color: '#065F46' }]}>Active</Text></View>
          </View>
          <Text style={styles.heroTitle}>Welcome{auth?.user?.name ? `, ${auth.user.name}` : ''}</Text>
          <Text style={styles.heroSub}>Track your field work and attendance</Text>
        </View>
        <View style={styles.heroRight}>
          <MaterialIcons name="dashboard" size={40} color="#0A66FF" />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => changeDay(-1)}>
            <MaterialIcons name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.dateText}>{selectedDate.toLocaleDateString()}</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => changeDay(1)}>
            <MaterialIcons name="chevron-right" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayBtn} onPress={() => setSelectedDate(new Date())}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}> 
            <ActivityIndicator color="#0A66FF" />
          </View>
        ) : error ? (
          <View style={styles.center}> 
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : dailyRecords.length === 0 ? (
          <View style={styles.center}> 
            <MaterialIcons name="event-busy" size={20} color="#9CA3AF" />
            <Text style={styles.emptyText}>No attendance for this day</Text>
          </View>
        ) : (
          <FlatList
            data={dailyRecords}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        )}
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Attendance')} activeOpacity={0.85}>
        <MaterialIcons name="camera-alt" size={24} color="#FFFFFF" />
      </TouchableOpacity>

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
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    display: 'none',
  },
  heroCard: { marginTop: 14, marginHorizontal: 24, backgroundColor: '#F0F7FF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  heroLeft: { flex: 1 },
  heroRight: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  heroSub: { fontSize: 12, color: '#4B5563', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  badge: { backgroundColor: '#E0EAFF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#1E40AF', fontWeight: '700', fontSize: 10 },
  content: {
    marginTop: 20,
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 8, marginBottom: 10 },
  dateBtn: { padding: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#F9FAFB' },
  dateText: { fontSize: 16, fontWeight: '800', color: '#111827', marginHorizontal: 4 },
  todayBtn: { marginLeft: 'auto', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F9FAFB' },
  todayText: { color: '#111827', fontWeight: '700' },
  center: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#B91C1C', fontWeight: '700' },
  emptyText: { color: '#6B7280', marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  photo: { width: '100%', height: 140, borderRadius: 10, marginBottom: 10 },
  photoPlaceholder: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#6B7280', fontWeight: '600' },
  value: { color: '#111827', fontWeight: '700', marginLeft: 6, flexShrink: 1, textAlign: 'right' },
  logoutBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fab: { position: 'absolute', right: 24, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0A66FF', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: '#0A66FF',
  },
  tabText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0A66FF',
  },
});


