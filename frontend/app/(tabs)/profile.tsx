import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Target, Scale, Ruler, Calendar, Edit3, TrendingUp, Award, ChevronRight, Dumbbell, Activity } from 'lucide-react-native';
import { useAuth } from '@/src/AuthContext';
import { userAPI, progressAPI } from '@/src/api';
import { colors, spacing, radius, typography, shadows } from '@/src/theme';

const goals = [
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'muscle_gain', label: 'Muscle Gain' },
  { id: 'general_fitness', label: 'General Fitness' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'flexibility', label: 'Flexibility' },
];
const levels = [
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
  const [logW, setLogW] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pr, sr, wr] = await Promise.all([userAPI.getProfile(), progressAPI.getStats(), progressAPI.getWeightHistory(30)]);
      setProfile(pr.data); setStats(sr.data); setWeightHistory(wr.data);
      setEditData({
        name: pr.data.name || '', age: pr.data.age?.toString() || '', weight: pr.data.weight?.toString() || '',
        height: pr.data.height?.toString() || '', goal: pr.data.goal || 'general_fitness', activity_level: pr.data.activity_level || 'moderate'
      });
    } catch (e) { console.log('Profile err:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const up: any = { name: editData.name };
      if (editData.age) up.age = parseInt(editData.age);
      if (editData.weight) up.weight = parseFloat(editData.weight);
      if (editData.height) up.height = parseFloat(editData.height);
      up.goal = editData.goal; up.activity_level = editData.activity_level;
      await userAPI.updateProfile(up); setEditing(false); loadData();
    } catch { Alert.alert('Error', 'Could not update profile'); }
    finally { setSaving(false); }
  };

  const handleLogW = async () => {
    if (!logW) return;
    try { await progressAPI.logWeight({ weight: parseFloat(logW) }); setLogW(''); loadData(); }
    catch { Alert.alert('Error', 'Could not log weight'); }
  };

  const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: logout }]);

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>

          {/* Profile Header */}
          <View style={s.header}>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{(profile?.name || 'U').charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={s.userName}>{profile?.name || 'User'}</Text>
            <Text style={s.userEmail}>{profile?.email}</Text>
            <Text style={s.userMotto}>Striving for progress, not perfection</Text>
          </View>

          {/* Stats Row */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statVal}>{stats?.total_workouts || 0}</Text>
              <Text style={s.statLabel}>Workouts</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statVal}>{stats?.streak || 0} <Text style={s.statUnit}>days</Text></Text>
              <Text style={s.statLabel}>Streak</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statVal}>{stats?.current_weight || '--'}</Text>
              <Text style={s.statLabel}>Weight</Text>
            </View>
          </View>

          {/* Log Weight */}
          <Text style={s.sectionTitle}>Log Weight</Text>
          <View style={s.weightRow}>
            <TextInput testID="weight-log-input" style={s.weightInput} placeholder="Weight (kg)" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={logW} onChangeText={setLogW} />
            <TouchableOpacity testID="log-weight-btn" style={s.weightBtn} onPress={handleLogW} activeOpacity={0.85}>
              <Scale size={16} color="#fff" />
              <Text style={s.weightBtnText}>Log</Text>
            </TouchableOpacity>
          </View>

          {/* Weight Chart */}
          {weightHistory.length > 0 && (
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Weight Trend</Text>
              <View style={s.chartBars}>
                {weightHistory.slice(-7).map((e, i) => {
                  const min = Math.min(...weightHistory.slice(-7).map(x => x.weight));
                  const max = Math.max(...weightHistory.slice(-7).map(x => x.weight));
                  const range = max - min || 1;
                  const pct = ((e.weight - min) / range) * 100;
                  return (
                    <View key={i} style={s.barWrap}>
                      <Text style={s.barVal}>{e.weight}</Text>
                      <View style={s.barBg}><View style={[s.barFill, { height: `${Math.max(pct, 15)}%` }]} /></View>
                      <Text style={s.barDate}>{e.date?.slice(5)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Profile Menu */}
          <View style={s.menuHeader}>
            <Text style={s.sectionTitle}>Profile Details</Text>
            <TouchableOpacity testID="edit-profile-btn" onPress={() => setEditing(!editing)}>
              <Edit3 size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={s.editCard}>
              <Text style={s.editLabel}>NAME</Text>
              <TextInput testID="edit-name" style={s.editInput} value={editData.name} onChangeText={v => setEditData(p => ({ ...p, name: v }))} />
              <View style={s.editRow}>
                <View style={{ flex: 1 }}><Text style={s.editLabel}>AGE</Text><TextInput style={s.editInput} keyboardType="numeric" value={editData.age} onChangeText={v => setEditData(p => ({ ...p, age: v }))} /></View>
                <View style={{ flex: 1 }}><Text style={s.editLabel}>HEIGHT (CM)</Text><TextInput style={s.editInput} keyboardType="numeric" value={editData.height} onChangeText={v => setEditData(p => ({ ...p, height: v }))} /></View>
              </View>
              <Text style={s.editLabel}>GOAL</Text>
              <View style={s.chipWrap}>
                {goals.map(g => (
                  <TouchableOpacity key={g.id} style={[s.chip, editData.goal === g.id && s.chipActive]} onPress={() => setEditData(p => ({ ...p, goal: g.id }))}>
                    <Text style={[s.chipText, editData.goal === g.id && s.chipTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.editLabel}>ACTIVITY LEVEL</Text>
              <View style={s.chipWrap}>
                {levels.map(a => (
                  <TouchableOpacity key={a.id} style={[s.chip, editData.activity_level === a.id && s.chipActive]} onPress={() => setEditData(p => ({ ...p, activity_level: a.id }))}>
                    <Text style={[s.chipText, editData.activity_level === a.id && s.chipTextActive]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity testID="save-profile-btn" style={s.saveBtn} onPress={saveProfile} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.menuCard}>
              <MenuItem icon={Target} label="Goal" value={goals.find(g => g.id === profile?.goal)?.label || 'Not set'} />
              <MenuItem icon={Activity} label="Activity" value={levels.find(a => a.id === profile?.activity_level)?.label || 'Not set'} />
              <MenuItem icon={Calendar} label="Age" value={profile?.age ? `${profile.age} years` : 'Not set'} />
              <MenuItem icon={Ruler} label="Height" value={profile?.height ? `${profile.height} cm` : 'Not set'} />
              <MenuItem icon={Scale} label="Weight" value={profile?.weight ? `${profile.weight} kg` : 'Not set'} last />
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity testID="logout-btn" style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <LogOut size={16} color={colors.error} />
            <Text style={s.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MenuItem({ icon: Icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) {
  return (
    <View style={[mi.row, !last && mi.border]}>
      <View style={mi.iconW}><Icon size={16} color={colors.primary} /></View>
      <Text style={mi.label}>{label}</Text>
      <Text style={mi.val}>{value}</Text>
      <ChevronRight size={14} color={colors.textMuted} />
    </View>
  );
}

const mi = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  iconW: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  val: { fontSize: 14, fontWeight: '600', color: colors.textMain, marginRight: 4 },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.screen },

  header: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.md },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: '#fff' },
  userName: { ...typography.h2, color: colors.textMain },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  userMotto: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 6 },

  statsRow: { flexDirection: 'row', backgroundColor: colors.cardBlue, borderRadius: radius.xl, paddingVertical: 18, paddingHorizontal: 20, marginBottom: spacing.lg, ...shadows.cardLight },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: colors.textMain },
  statUnit: { fontSize: 12, fontWeight: '400' },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 4 },

  sectionTitle: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md },
  weightRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  weightInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textMain },
  weightBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 22, paddingVertical: 12, ...shadows.button },
  weightBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  chartCard: { backgroundColor: colors.cardBlue, borderRadius: radius.xl, padding: 18, marginBottom: spacing.lg },
  chartTitle: { fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 14 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  barWrap: { alignItems: 'center', flex: 1 },
  barVal: { fontSize: 9, color: colors.textMuted, marginBottom: 4 },
  barBg: { width: 22, height: 60, backgroundColor: colors.surfaceBlue, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { backgroundColor: colors.primary, borderRadius: 6 },
  barDate: { fontSize: 9, color: colors.textMuted, marginTop: 4 },

  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuCard: { backgroundColor: colors.cardBlue, borderRadius: radius.xl, paddingHorizontal: 16, marginBottom: spacing.md },
  editCard: { backgroundColor: colors.cardBlue, borderRadius: radius.xl, padding: 18, marginBottom: spacing.md, gap: 8 },
  editLabel: { ...typography.label, color: colors.textMuted, marginBottom: 4, marginTop: 4 },
  editInput: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.textMain },
  editRow: { flexDirection: 'row', gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 8, ...shadows.button },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: spacing.md, borderWidth: 1.5, borderColor: colors.error, borderRadius: radius.md },
  logoutText: { fontSize: 14, fontWeight: '600', color: colors.error },
});
