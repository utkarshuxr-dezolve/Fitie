import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogOut, Target, Scale, Ruler, Calendar, ChevronRight, Edit3, TrendingUp, Award } from 'lucide-react-native';
import { useAuth } from '@/src/AuthContext';
import { userAPI, progressAPI } from '@/src/api';
import { colors, spacing, radius, typography } from '@/src/theme';

const goals = [
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'muscle_gain', label: 'Muscle Gain' },
  { id: 'general_fitness', label: 'General Fitness' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'flexibility', label: 'Flexibility' },
];

const activityLevels = [
  { id: 'sedentary', label: 'Sedentary' },
  { id: 'light', label: 'Light' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'active', label: 'Active' },
  { id: 'very_active', label: 'Very Active' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', age: '', weight: '', height: '', goal: '', activity_level: '' });
  const [logWeight, setLogWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, statsRes, weightRes] = await Promise.all([
        userAPI.getProfile(),
        progressAPI.getStats(),
        progressAPI.getWeightHistory(30),
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setWeightHistory(weightRes.data);
      setEditData({
        name: profileRes.data.name || '',
        age: profileRes.data.age?.toString() || '',
        weight: profileRes.data.weight?.toString() || '',
        height: profileRes.data.height?.toString() || '',
        goal: profileRes.data.goal || 'general_fitness',
        activity_level: profileRes.data.activity_level || 'moderate',
      });
    } catch (e) { console.log('Profile load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const update: any = { name: editData.name };
      if (editData.age) update.age = parseInt(editData.age);
      if (editData.weight) update.weight = parseFloat(editData.weight);
      if (editData.height) update.height = parseFloat(editData.height);
      update.goal = editData.goal;
      update.activity_level = editData.activity_level;
      await userAPI.updateProfile(update);
      setEditing(false);
      loadData();
    } catch { Alert.alert('Error', 'Could not update profile'); }
    finally { setSaving(false); }
  };

  const handleLogWeight = async () => {
    if (!logWeight) return;
    try {
      await progressAPI.logWeight({ weight: parseFloat(logWeight) });
      setLogWeight('');
      loadData();
    } catch { Alert.alert('Error', 'Could not log weight'); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
          
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(profile?.name || 'U').charAt(0).toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{profile?.email}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stats?.total_workouts || 0}</Text>
                <Text style={styles.statLbl}>Workouts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stats?.streak || 0}</Text>
                <Text style={styles.statLbl}>Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stats?.current_weight ? `${stats.current_weight}` : '--'}</Text>
                <Text style={styles.statLbl}>Weight</Text>
              </View>
            </View>
          </View>

          {/* Log Weight */}
          <Text style={styles.sectionTitle}>Log Weight</Text>
          <View style={styles.weightLogRow}>
            <TextInput testID="weight-log-input" style={styles.weightInput} placeholder="Weight (kg)" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={logWeight} onChangeText={setLogWeight} />
            <TouchableOpacity testID="log-weight-btn" style={styles.weightBtn} onPress={handleLogWeight}>
              <Scale size={18} color={colors.textInverse} />
              <Text style={styles.weightBtnText}>Log</Text>
            </TouchableOpacity>
          </View>

          {/* Weight History */}
          {weightHistory.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Weight Trend</Text>
              <View style={styles.weightChart}>
                {weightHistory.slice(-7).map((entry, i) => {
                  const min = Math.min(...weightHistory.slice(-7).map(e => e.weight));
                  const max = Math.max(...weightHistory.slice(-7).map(e => e.weight));
                  const range = max - min || 1;
                  const pct = ((entry.weight - min) / range) * 100;
                  return (
                    <View key={i} style={styles.weightBarWrap}>
                      <Text style={styles.weightBarValue}>{entry.weight}</Text>
                      <View style={styles.weightBarBg}>
                        <View style={[styles.weightBarFill, { height: `${Math.max(pct, 15)}%` }]} />
                      </View>
                      <Text style={styles.weightBarDate}>{entry.date?.slice(5)}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Edit Profile */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            <TouchableOpacity testID="edit-profile-btn" onPress={() => setEditing(!editing)}>
              <Edit3 size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NAME</Text>
                <TextInput testID="edit-name" style={styles.input} value={editData.name} onChangeText={v => setEditData(p => ({ ...p, name: v }))} />
              </View>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>AGE</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={editData.age} onChangeText={v => setEditData(p => ({ ...p, age: v }))} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>HEIGHT (CM)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={editData.height} onChangeText={v => setEditData(p => ({ ...p, height: v }))} />
                </View>
              </View>

              <Text style={styles.inputLabel}>GOAL</Text>
              <View style={styles.chipRow}>
                {goals.map(g => (
                  <TouchableOpacity key={g.id} style={[styles.chip, editData.goal === g.id && styles.chipActive]} onPress={() => setEditData(p => ({ ...p, goal: g.id }))}>
                    <Text style={[styles.chipText, editData.goal === g.id && styles.chipTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>ACTIVITY LEVEL</Text>
              <View style={styles.chipRow}>
                {activityLevels.map(a => (
                  <TouchableOpacity key={a.id} style={[styles.chip, editData.activity_level === a.id && styles.chipActive]} onPress={() => setEditData(p => ({ ...p, activity_level: a.id }))}>
                    <Text style={[styles.chipText, editData.activity_level === a.id && styles.chipTextActive]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity testID="save-profile-btn" style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.detailsList}>
              <DetailRow icon={Target} label="Goal" value={goals.find(g => g.id === profile?.goal)?.label || 'Not set'} />
              <DetailRow icon={TrendingUp} label="Activity" value={activityLevels.find(a => a.id === profile?.activity_level)?.label || 'Not set'} />
              <DetailRow icon={Calendar} label="Age" value={profile?.age ? `${profile.age} years` : 'Not set'} />
              <DetailRow icon={Ruler} label="Height" value={profile?.height ? `${profile.height} cm` : 'Not set'} />
              <DetailRow icon={Scale} label="Weight" value={profile?.weight ? `${profile.weight} kg` : 'Not set'} />
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={18} color={colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <View style={detailStyles.iconWrap}><Icon size={16} color={colors.primary} /></View>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  label: { ...typography.body, color: colors.textMuted, flex: 1 },
  value: { ...typography.body, fontWeight: '600', color: colors.textMain },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screen },
  profileHeader: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.lg },
  avatarWrap: { marginBottom: spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.textInverse },
  profileName: { ...typography.h2, color: colors.textMain },
  profileEmail: { ...typography.bodySm, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { ...typography.h3, color: colors.textMain, fontWeight: '700' },
  statLbl: { ...typography.bodySm, color: colors.textMuted, fontSize: 12 },
  statDivider: { width: 1, backgroundColor: colors.border },
  sectionTitle: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md, marginTop: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weightLogRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  weightInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.textMain },
  weightBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 12 },
  weightBtnText: { ...typography.bodySm, fontWeight: '600', color: colors.textInverse },
  weightChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, marginBottom: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  weightBarWrap: { alignItems: 'center', flex: 1 },
  weightBarValue: { fontSize: 10, color: colors.textMuted, marginBottom: 4 },
  weightBarBg: { width: 20, height: 60, backgroundColor: colors.surfaceSecondary, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  weightBarFill: { backgroundColor: colors.primary, borderRadius: 4 },
  weightBarDate: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  editForm: { gap: spacing.md, marginBottom: spacing.lg },
  inputGroup: { gap: spacing.xs },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  inputLabel: { ...typography.label, color: colors.textMuted, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.textMain },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.bodySm, fontWeight: '500', color: colors.textMuted },
  chipTextActive: { color: colors.textInverse },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  detailsList: {},
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: spacing.md, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.error, borderRadius: radius.md },
  logoutText: { ...typography.body, fontWeight: '600', color: colors.error },
});
