import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { auth, clearAuth } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setError('');
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
          headers: { Authorization: `Bearer ${auth?.accessToken || ''}` },
        });
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          setError(data?.message || 'Failed to load profile');
        } else {
          setUser(data?.user || null);
        }
      } catch (e) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [auth?.accessToken]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => { clearAuth(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}> 
          <ActivityIndicator size="small" color="#0A66FF" />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {user && (
            <>
              <View style={styles.heroCard}>
                <View style={styles.avatar}><MaterialIcons name="person" size={36} color="#0A66FF" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nameText}>{user.fullName || 'User'}</Text>
                  <Text style={styles.emailText}>{user.email}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, user.isVerified ? styles.badgeOk : styles.badgeWarn]}>
                      <MaterialIcons name={user.isVerified ? 'verified' : 'hourglass-empty'} size={14} color={user.isVerified ? '#065F46' : '#92400E'} />
                      <Text style={[styles.badgeText, user.isVerified ? { color: '#065F46' } : { color: '#92400E' }]}>{user.isVerified ? 'Verified' : 'Pending'}</Text>
                    </View>
                    {user.role && (
                      <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
                        <MaterialIcons name="admin-panel-settings" size={14} color="#1E40AF" />
                        <Text style={[styles.badgeText, { color: '#1E40AF' }]}>{user.role}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Row label="Organization" value={user.organization || '—'} />
                <Row label="Phone" value={user.phoneNumber || '—'} />
                <Row label="State" value={user.state || '—'} />
                <Row label="Base Location" value={user.baseLocation || '—'} />
              </View>
            </>
          )}
        </ScrollView>
      )}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Dashboard')} activeOpacity={0.8}> 
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, styles.tabActive]} activeOpacity={0.8}> 
          <Text style={[styles.tabText, styles.tabTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}> 
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingHorizontal: 24, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBox: { margin: 24, padding: 12, backgroundColor: '#FEE2E2', borderRadius: 10 },
  errorText: { color: '#B91C1C' },
  scroll: { padding: 24 },
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0F7FF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  nameText: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emailText: { fontSize: 12, color: '#4B5563', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeOk: { backgroundColor: '#D1FAE5' },
  badgeWarn: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { color: '#6B7280', fontWeight: '600' },
  rowValue: { color: '#111827', fontWeight: '600' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderTopWidth: 2, borderTopColor: '#0A66FF' },
  tabText: { color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#0A66FF' },
  logoutBtn: { backgroundColor: '#EF4444', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  logoutText: { color: '#FFFFFF', fontWeight: '700' },
});


