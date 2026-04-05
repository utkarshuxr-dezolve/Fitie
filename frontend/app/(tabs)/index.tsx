import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame, Dumbbell, UtensilsCrossed, TrendingUp, Scan, ChevronRight, Zap } from 'lucide-react-native';
import { useAuth } from '@/src/AuthContext';
import { progressAPI, nutritionAPI, workoutAPI } from '@/src/api';
import { colors, spacing, radius, typography } from '@/src/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [todayMeals, setTodayMeals] = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, mealsRes, workoutsRes] = await Promise.all([
        progressAPI.getStats(),
        nutritionAPI.getToday(),
        workoutAPI.getHistory(3),
      ]);
      setStats(statsRes.data);
      setTodayMeals(mealsRes.data);
      setRecentWorkouts(workoutsRes.data);
    } catch (e) {
      console.log('Error loading home data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const firstName = user?.name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey, {firstName}</Text>
            <Text style={styles.subGreeting}>Let's crush your goals today</Text>
          </View>
          <View style={styles.streakBadge}>
            <Flame size={16} color={colors.warning} />
            <Text style={styles.streakText}>{stats?.streak || 0}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity testID="quick-scan-btn" style={styles.quickActionMain} onPress={() => router.push('/(tabs)/activity')}>
            <View style={styles.quickActionIcon}>
              <Scan size={24} color={colors.textInverse} />
            </View>
            <View style={styles.quickActionTextWrap}>
              <Text style={styles.quickActionTitle}>Scan Machine</Text>
              <Text style={styles.quickActionSub}>Identify gym equipment</Text>
            </View>
            <ChevronRight size={20} color={colors.textInverse} />
          </TouchableOpacity>
          
          <View style={styles.quickActionRow}>
            <TouchableOpacity testID="quick-workout-btn" style={styles.quickActionSmall} onPress={() => router.push('/(tabs)/activity')}>
              <Dumbbell size={20} color={colors.primary} />
              <Text style={styles.quickSmallText}>Start Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="quick-meal-btn" style={styles.quickActionSmall} onPress={() => router.push('/(tabs)/nutrition')}>
              <UtensilsCrossed size={20} color={colors.primary} />
              <Text style={styles.quickSmallText}>Log Meal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Flame size={18} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{todayMeals?.totals?.calories || 0}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EBF3ED' }]}>
              <Dumbbell size={18} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats?.week_workouts || 0}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EDE9FE' }]}>
              <TrendingUp size={18} color="#7C3AED" />
            </View>
            <Text style={styles.statValue}>{stats?.total_workouts || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FCE7F3' }]}>
              <Zap size={18} color="#EC4899" />
            </View>
            <Text style={styles.statValue}>{stats?.current_weight ? `${stats.current_weight}` : '--'}</Text>
            <Text style={styles.statLabel}>Weight (kg)</Text>
          </View>
        </View>

        {/* Macros Summary */}
        {todayMeals && todayMeals.totals && (
          <>
            <Text style={styles.sectionTitle}>Macro Breakdown</Text>
            <View style={styles.macroCard}>
              <MacroBar label="Protein" value={todayMeals.totals.protein} max={150} color={colors.primary} />
              <MacroBar label="Carbs" value={todayMeals.totals.carbs} max={250} color={colors.warning} />
              <MacroBar label="Fat" value={todayMeals.totals.fat} max={70} color="#EC4899" />
            </View>
          </>
        )}

        {/* Recent Workouts */}
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {recentWorkouts.length > 0 ? (
          recentWorkouts.map((w, i) => (
            <View key={i} style={styles.workoutCard}>
              <View style={styles.workoutIconWrap}>
                <Dumbbell size={18} color={colors.primary} />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{w.plan_name}</Text>
                <Text style={styles.workoutMeta}>{w.duration_minutes} min · {w.exercises?.length || 0} exercises</Text>
              </View>
              <Text style={styles.workoutCal}>{w.calories_burned} cal</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Dumbbell size={32} color={colors.border} />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubText}>Start your first workout today!</Text>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={macroStyles.row}>
      <View style={macroStyles.labelWrap}>
        <Text style={macroStyles.label}>{label}</Text>
        <Text style={macroStyles.value}>{Math.round(value)}g</Text>
      </View>
      <View style={macroStyles.barBg}>
        <View style={[macroStyles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  row: { marginBottom: 12 },
  labelWrap: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { ...typography.bodySm, color: colors.textMuted, fontWeight: '500' },
  value: { ...typography.bodySm, color: colors.textMain, fontWeight: '600' },
  barBg: { height: 8, backgroundColor: colors.surfaceSecondary, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screen },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  greeting: { ...typography.h2, color: colors.textMain },
  subGreeting: { ...typography.bodySm, color: colors.textMuted, marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, gap: 4 },
  streakText: { fontSize: 14, fontWeight: '700', color: colors.warning },
  quickActions: { marginBottom: spacing.lg },
  quickActionMain: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  quickActionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  quickActionTextWrap: { flex: 1 },
  quickActionTitle: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  quickActionSub: { ...typography.bodySm, color: 'rgba(255,255,255,0.7)' },
  quickActionRow: { flexDirection: 'row', gap: spacing.sm },
  quickActionSmall: { flex: 1, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  quickSmallText: { ...typography.bodySm, fontWeight: '600', color: colors.primary },
  sectionTitle: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { width: '48%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, flexGrow: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { ...typography.h2, color: colors.textMain },
  statLabel: { ...typography.bodySm, color: colors.textMuted, marginTop: 2 },
  macroCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  workoutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  workoutIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  workoutInfo: { flex: 1 },
  workoutName: { ...typography.body, fontWeight: '600', color: colors.textMain },
  workoutMeta: { ...typography.bodySm, color: colors.textMuted },
  workoutCal: { ...typography.bodySm, fontWeight: '600', color: colors.primary },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm },
  emptyText: { ...typography.body, fontWeight: '600', color: colors.textMain },
  emptySubText: { ...typography.bodySm, color: colors.textMuted },
});
