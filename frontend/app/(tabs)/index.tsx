import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame, Dumbbell, ChevronRight, Play, Target, TrendingUp, Zap } from 'lucide-react-native';
import { useAuth } from '@/src/AuthContext';
import { progressAPI, nutritionAPI, workoutAPI } from '@/src/api';
import { colors, spacing, radius, typography, shadows } from '@/src/theme';
import { SkeletonCard, Skeleton } from '@/src/components/Skeleton';
import { formatNetworkError } from '@/src/formatError';

const MACRO_MAXS = { protein: 150, carbs: 250, fat: 70 } as const;

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [todayMeals, setTodayMeals] = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sr, mr, wr, pr] = await Promise.all([
        progressAPI.getStats(), nutritionAPI.getToday(), workoutAPI.getHistory(3), workoutAPI.getPlans()
      ]);
      setStats(sr.data); setTodayMeals(mr.data); setRecentWorkouts(wr.data); setPlans(pr.data);
    } catch (e: any) {
      console.log('Home load error:', formatNetworkError(e));
    }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Skeleton height={28} width="60%" style={{ marginBottom: spacing.sm }} />
          <Skeleton height={14} width="45%" style={{ marginBottom: spacing.lg }} />
          <SkeletonCard />
          <SkeletonCard />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.lg }}>
            <Skeleton width="47%" height={100} />
            <Skeleton width="47%" height={100} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>

        {/* Greeting */}
        <View style={s.greeting}>
          <View style={{ flex: 1 }}>
            <Text style={s.wave}>Hello, {firstName}</Text>
            <Text style={s.greetSub}>Ready for a great day?</Text>
          </View>
          <View style={s.streakPill}>
            <Flame size={14} color={colors.warning} />
            <Text style={s.streakNum}>{stats?.streak || 0} days</Text>
          </View>
        </View>

        {/* Badges Row */}
        <View style={s.badgeRow}>
          <View style={s.badgePill}><Target size={12} color={colors.primary} /><Text style={s.badgeText}>{stats?.goal?.replace('_', ' ') || 'General'}</Text></View>
          <View style={s.badgePill}><TrendingUp size={12} color={colors.primary} /><Text style={s.badgeText}>{stats?.total_workouts || 0} workouts</Text></View>
        </View>

        {/* Today's Workout Section Header */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Today&apos;s workout</Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </View>

        {/* Daily Challenge - Blue Featured Card */}
        <TouchableOpacity testID="quick-scan-btn" style={s.challengeCard} onPress={() => router.push('/(tabs)/activity')} activeOpacity={0.9}>
          <View style={s.challengeOverlay} />
          <View style={s.challengeLeft}>
            <Text style={s.challengeLabel}>Daily Challenge</Text>
            <Text style={s.challengeDesc}>Scan a machine &amp; start your session</Text>
          </View>
          <View style={s.challengeBtn}>
            <Text style={s.challengeBtnText}>Start</Text>
            <Play size={12} color={colors.primary} fill={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* First Workout Plan Card */}
        {plans.length > 0 && (
          <TouchableOpacity testID="quick-workout-btn" style={s.workoutCard} onPress={() => router.push('/(tabs)/activity')} activeOpacity={0.92}>
            <View style={s.workoutCardHeader}>
              <Text style={s.workoutCardTitle}>{plans[0].name}</Text>
              <View style={s.workoutDiffBadge}>
                <Text style={s.workoutDiffText}>{plans[0].difficulty}</Text>
              </View>
            </View>
            <View style={s.workoutDetailRow}>
              <View style={s.workoutDetail}>
                <Text style={s.workoutDetailLabel}>Time</Text>
                <Text style={s.workoutDetailVal}>45 minutes</Text>
              </View>
              <View style={s.workoutDetail}>
                <Text style={s.workoutDetailLabel}>Exercises</Text>
                <Text style={s.workoutDetailVal}>{plans[0].exercises?.length || 0}</Text>
              </View>
              <View style={s.workoutDetail}>
                <Text style={s.workoutDetailLabel}>Days/Week</Text>
                <Text style={s.workoutDetailVal}>{plans[0].days_per_week}x</Text>
              </View>
            </View>
            <View style={s.workoutActions}>
              <TouchableOpacity style={s.workoutSecBtn}><Text style={s.workoutSecBtnText}>See workout</Text></TouchableOpacity>
              <TouchableOpacity style={s.workoutPrimBtn}><Text style={s.workoutPrimBtnText}>Start workout</Text><Play size={11} color="#fff" fill="#fff" /></TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Second Plan */}
        {plans.length > 1 && (
          <TouchableOpacity style={s.miniWorkoutCard} onPress={() => router.push('/(tabs)/activity')} activeOpacity={0.92}>
            <View style={{ flex: 1 }}>
              <Text style={s.miniWorkoutName}>{plans[1].name}</Text>
              <Text style={s.miniWorkoutMeta}>{plans[1].days_per_week}x/week &middot; {plans[1].duration_weeks} weeks</Text>
            </View>
            <View style={s.miniStartBtn}>
              <Text style={s.miniStartText}>Start</Text>
              <Play size={10} color={colors.primary} fill={colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        <Text style={[s.sectionTitle, { marginTop: spacing.lg }]}>Your Stats</Text>
        <View style={s.statsGrid}>
          <StatCard icon={Flame} label="Calories" value={`${todayMeals?.totals?.calories || 0}`} color={colors.warning} bg={colors.warningBg} />
          <StatCard icon={Dumbbell} label="This Week" value={`${stats?.week_workouts || 0}`} color={colors.primary} bg={colors.primaryBg} />
          <StatCard icon={TrendingUp} label="Total" value={`${stats?.total_workouts || 0}`} color={colors.purple} bg={colors.infoBg} />
          <StatCard icon={Zap} label="Weight" value={stats?.current_weight ? `${stats.current_weight}kg` : '--'} color={colors.pink} bg={colors.pinkBg} />
        </View>

        {/* Macro Progress */}
        {todayMeals?.totals && (
          <>
            <Text style={[s.sectionTitle, { marginTop: spacing.lg }]}>Macro Breakdown</Text>
            <View style={s.macroCard}>
              <MacroRow label="Protein" val={todayMeals.totals.protein} max={MACRO_MAXS.protein} color={colors.primary} />
              <MacroRow label="Carbs" val={todayMeals.totals.carbs} max={MACRO_MAXS.carbs} color={colors.warning} />
              <MacroRow label="Fat" val={todayMeals.totals.fat} max={MACRO_MAXS.fat} color={colors.pink} />
            </View>
          </>
        )}

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: spacing.lg }]}>Completed</Text>
            {recentWorkouts.map((w, i) => (
              <View key={i} style={s.historyItem}>
                <View style={s.historyIcon}><Dumbbell size={16} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.historyName}>{w.plan_name}</Text>
                  <Text style={s.historyMeta}>{w.duration_minutes} min &middot; {w.exercises?.length || 0} exercises</Text>
                </View>
                <View style={s.historyCalBadge}><Text style={s.historyCalText}>{Math.round(w.calories_burned)} cal</Text></View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <View style={[sc.card, { backgroundColor: bg }]}>
      <Icon size={18} color={color} strokeWidth={2.2} />
      <Text style={sc.val}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

function MacroRow({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = Math.min((val / max) * 100, 100);
  return (
    <View style={mr.row}>
      <View style={mr.head}><Text style={mr.label}>{label}</Text><Text style={mr.val}>{Math.round(val)}g <Text style={mr.max}>/ {max}g</Text></Text></View>
      <View style={mr.barBg}><View style={[mr.barFill, { width: `${pct}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

const sc = StyleSheet.create({
  card: { width: '47%', borderRadius: radius.lg, padding: 16, marginBottom: spacing.sm, gap: 6 },
  val: { ...typography.statNum, color: colors.textMain },
  label: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
});

const mr = StyleSheet.create({
  row: { marginBottom: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMain },
  val: { fontSize: 13, fontWeight: '700', color: colors.textMain },
  max: { fontWeight: '400', color: colors.textMuted },
  barBg: { height: 10, backgroundColor: colors.surfaceBlue, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl },

  greeting: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, marginBottom: 8 },
  wave: { ...typography.h1, color: colors.textMain },
  greetSub: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.warningBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full },
  streakNum: { fontSize: 12, fontWeight: '700', color: colors.warningText },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primaryBg, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.primary, textTransform: 'capitalize' },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md },

  challengeCard: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, ...shadows.button, overflow: 'hidden', position: 'relative' as const },
  challengeOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.05)' },
  challengeLeft: { flex: 1 },
  challengeLabel: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  challengeDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  challengeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full },
  challengeBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  workoutCard: { backgroundColor: colors.cardBlue, borderRadius: radius.xl, padding: 20, marginBottom: spacing.sm, ...shadows.cardLight },
  workoutCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  workoutCardTitle: { ...typography.h3, color: colors.textMain, flex: 1 },
  workoutDiffBadge: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  workoutDiffText: { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
  workoutDetailRow: { flexDirection: 'row', marginBottom: 16, gap: 16 },
  workoutDetail: {},
  workoutDetailLabel: { ...typography.label, color: colors.textMuted, marginBottom: 2 },
  workoutDetailVal: { ...typography.bodyMd, color: colors.textMain },
  workoutActions: { flexDirection: 'row', gap: 10 },
  workoutSecBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' },
  workoutSecBtnText: { ...typography.bodyMd, color: colors.primary },
  workoutPrimBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  workoutPrimBtnText: { ...typography.bodyMd, color: '#fff' },

  miniWorkoutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBlue, borderRadius: radius.lg, padding: 16, marginBottom: spacing.sm },
  miniWorkoutName: { ...typography.bodyMd, fontWeight: '600', color: colors.textMain },
  miniWorkoutMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  miniStartBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full },
  miniStartText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  macroCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 18 },

  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  historyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyName: { ...typography.bodyMd, fontWeight: '600', color: colors.textMain },
  historyMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  historyCalBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  historyCalText: { fontSize: 11, fontWeight: '700', color: colors.primary },
});
