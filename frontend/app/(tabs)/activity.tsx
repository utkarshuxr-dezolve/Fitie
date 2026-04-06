import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell, Scan, ChevronRight, Play, CheckCircle, X, Filter, Search, ArrowLeft, Pause, RotateCcw } from 'lucide-react-native';
import { exerciseAPI, workoutAPI, scanAPI } from '@/src/api';
import { colors, spacing, radius, typography, shadows } from '@/src/theme';
import { Skeleton, SkeletonCard } from '@/src/components/Skeleton';
import { formatNetworkError } from '@/src/formatError';

type Exercise = { id: string; name: string; muscle_group: string; equipment: string; difficulty: string; description: string; instructions: string[]; calories_per_min: number };

export default function ActivityScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [workoutPaused, setWorkoutPaused] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [exRes, groupRes, planRes, activeRes] = await Promise.all([
        exerciseAPI.getAll(selectedGroup ? { muscle_group: selectedGroup } : undefined),
        exerciseAPI.getMuscleGroups(), workoutAPI.getPlans(), workoutAPI.getActive(),
      ]);
      setExercises(exRes.data); setMuscleGroups(groupRes.data); setPlans(planRes.data);
      if (activeRes.data) { setActiveWorkout(activeRes.data); setShowWorkoutModal(true); }
    } catch (e: any) {
      console.log('Activity load error:', formatNetworkError(e));
    }
    finally { setLoading(false); setRefreshing(false); }
  }, [selectedGroup]);

  useEffect(() => { loadData(); }, [loadData]);

  // Timer interval — respects paused state
  useEffect(() => {
    let iv: any;
    if (activeWorkout && showWorkoutModal && !workoutPaused) {
      iv = setInterval(() => setWorkoutTimer(t => t + 1), 1000);
    }
    return () => clearInterval(iv);
  }, [activeWorkout, showWorkoutModal, workoutPaused]);

  const handleScan = async () => {
    setScanLoading(true); setShowScanModal(true);
    try { const { data } = await scanAPI.detect(); setScanResult(data); }
    catch (e: any) { Alert.alert('Scan Error', formatNetworkError(e, 'Could not detect machine')); }
    finally { setScanLoading(false); }
  };

  const toggleEx = (id: string) => setSelectedExercises(p => p.includes(id) ? p.filter(e => e !== id) : [...p, id]);

  const startWorkout = async (ids?: string[], planName?: string) => {
    const eids = ids || selectedExercises;
    if (eids.length === 0) { Alert.alert('Select Exercises', 'Pick at least one exercise'); return; }
    try {
      const { data } = await workoutAPI.start({ exercise_ids: eids, plan_name: planName });
      setActiveWorkout(data); setWorkoutTimer(0); setWorkoutPaused(false); setShowWorkoutModal(true); setSelectedExercises([]);
    } catch (e: any) { Alert.alert('Workout Error', formatNetworkError(e, 'Could not start workout')); }
  };

  const completeWorkout = async () => {
    if (!activeWorkout) return;
    try {
      const cals = activeWorkout.exercises.reduce((sum: number, ex: any) => sum + (ex.calories_per_min || 5) * (workoutTimer / 60), 0);
      await workoutAPI.complete(activeWorkout.id, { duration_minutes: Math.max(1, Math.round(workoutTimer / 60)), calories_burned: Math.round(cals) });
      setShowWorkoutModal(false); setActiveWorkout(null); setWorkoutTimer(0); setWorkoutPaused(false);
      Alert.alert('Workout Complete!', `Great job! ${Math.round(workoutTimer / 60)} minutes completed.`);
    } catch (e: any) { Alert.alert('Error', formatNetworkError(e, 'Could not complete workout')); }
  };

  const discardWorkout = () => {
    setShowWorkoutModal(false);
    setActiveWorkout(null);
    setWorkoutTimer(0);
    setWorkoutPaused(false);
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const filtered = searchQ ? exercises.filter(e => e.name.toLowerCase().includes(searchQ.toLowerCase())) : exercises;

  // Estimated calories for active workout
  const estimatedCals = activeWorkout
    ? Math.round(activeWorkout.exercises.reduce((sum: number, ex: any) => sum + (ex.calories_per_min || 5) * (workoutTimer / 60), 0))
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
          <Skeleton height={28} width="50%" style={{ marginBottom: spacing.lg }} />
          <SkeletonCard />
          <Skeleton height={44} style={{ marginBottom: spacing.md }} />
          <Skeleton width={60} height={32} style={{ marginBottom: spacing.md }} />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
        <Text style={st.pageTitle}>Exercise Library</Text>

        {/* Scan Machine */}
        <TouchableOpacity testID="scan-machine-btn" style={st.scanCard} onPress={handleScan} activeOpacity={0.9}>
          <View style={st.scanIconWrap}><Scan size={22} color="#fff" strokeWidth={2.5} /></View>
          <View style={{ flex: 1 }}>
            <Text style={st.scanTitle}>Scan Machine</Text>
            <Text style={st.scanSub}>Identify gym equipment instantly</Text>
          </View>
          <View style={st.scanArrow}><ChevronRight size={18} color={colors.primary} /></View>
        </TouchableOpacity>

        {/* Search */}
        <View style={st.searchWrap}>
          <Search size={18} color={colors.textMuted} />
          <TextInput style={st.searchInput} placeholder="Search exercises..." placeholderTextColor={colors.textMuted} value={searchQ} onChangeText={setSearchQ} />
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.filterScroll} contentContainerStyle={st.filterContent}>
          <TouchableOpacity style={[st.filterChip, !selectedGroup && st.filterActive]} onPress={() => setSelectedGroup('')}>
            <Text style={[st.filterText, !selectedGroup && st.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {muscleGroups.map(g => (
            <TouchableOpacity key={g} style={[st.filterChip, selectedGroup === g && st.filterActive]} onPress={() => setSelectedGroup(g)}>
              <Text style={[st.filterText, selectedGroup === g && st.filterTextActive]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Workout Plans */}
        <Text style={st.sectionTitle}>Workout Plans</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.plansScroll}>
          {plans.map((plan, i) => (
            <TouchableOpacity key={i} testID={`plan-${plan.id}`} style={st.planCard} onPress={() => startWorkout(plan.exercises, plan.name)} activeOpacity={0.9}>
              <View style={st.planBadge}><Text style={st.planBadgeText}>{plan.difficulty}</Text></View>
              <Text style={st.planName}>{plan.name}</Text>
              <Text style={st.planMeta}>{plan.days_per_week}x/week &middot; {plan.duration_weeks}wk</Text>
              <View style={st.planStart}><Play size={11} color="#fff" fill="#fff" /><Text style={st.planStartText}>Start</Text></View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exercises */}
        <Text style={st.sectionTitle}>Exercises</Text>
        {filtered.map(ex => (
          <TouchableOpacity key={ex.id} testID={`exercise-${ex.id}`} style={[st.exCard, selectedExercises.includes(ex.id) && st.exCardSel]} onPress={() => toggleEx(ex.id)} activeOpacity={0.85}>
            <View style={[st.exIcon, selectedExercises.includes(ex.id) && st.exIconSel]}>
              <Dumbbell size={16} color={selectedExercises.includes(ex.id) ? '#fff' : colors.primary} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.exName}>{ex.name}</Text>
              <Text style={st.exMeta}>{ex.muscle_group} &middot; {ex.equipment} &middot; {ex.difficulty}</Text>
            </View>
            {selectedExercises.includes(ex.id) ? <CheckCircle size={20} color={colors.primary} /> : <ChevronRight size={16} color={colors.textMuted} />}
          </TouchableOpacity>
        ))}

        {selectedExercises.length > 0 && (
          <TouchableOpacity testID="start-workout-btn" style={st.startBtn} onPress={() => startWorkout()} activeOpacity={0.85}>
            <Play size={16} color="#fff" fill="#fff" />
            <Text style={st.startBtnText}>Start Workout ({selectedExercises.length})</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Scan Modal */}
      <Modal visible={showScanModal} animationType="slide" transparent>
        <View style={st.modalBg}>
          <View style={st.modalBox}>
            <View style={st.modalHead}>
              <Text style={st.modalTitle}>Equipment Detected</Text>
              <TouchableOpacity testID="close-scan-modal" onPress={() => { setShowScanModal(false); setScanResult(null); }}><X size={22} color={colors.textMain} /></TouchableOpacity>
            </View>
            {scanLoading ? <View style={st.loadWrap}><ActivityIndicator size="large" color={colors.primary} /><Text style={st.loadText}>Scanning...</Text></View> : scanResult ? (
              <>
                <View style={st.detectedBox}>
                  <Text style={st.detectedName}>{scanResult.detected.name}</Text>
                  <View style={st.confBadge}><Text style={st.confText}>{Math.round(scanResult.detected.confidence * 100)}% match</Text></View>
                </View>
                <Text style={st.detectedExTitle}>Available Exercises</Text>
                {scanResult.exercises?.map((ex: any, i: number) => (
                  <TouchableOpacity key={i} style={st.detectedExRow} onPress={() => { toggleEx(ex.id); setShowScanModal(false); setScanResult(null); }}>
                    <Dumbbell size={14} color={colors.primary} />
                    <Text style={st.detectedExName}>{ex.name}</Text>
                    <ChevronRight size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Active Workout */}
      <Modal visible={showWorkoutModal} animationType="slide">
        <SafeAreaView style={st.workoutSafe}>
          <View style={st.workoutHead}>
            <TouchableOpacity testID="close-workout-modal" onPress={() => setShowWorkoutModal(false)}><ArrowLeft size={22} color={colors.textMain} /></TouchableOpacity>
            <Text style={st.workoutTitle}>{activeWorkout?.plan_name || 'Workout'}</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={st.timerWrap}>
            <View style={st.timerCircle}><Text style={st.timerText}>{fmt(workoutTimer)}</Text><Text style={st.timerLabel}>Elapsed Time</Text></View>
            {estimatedCals > 0 && <Text style={st.timerCals}>~{estimatedCals} cal burned</Text>}
          </View>
          {workoutPaused && (
            <View style={st.pausedBanner}><Text style={st.pausedText}>Workout paused</Text></View>
          )}
          <ScrollView style={st.workoutList}>
            {activeWorkout?.exercises?.map((ex: any, i: number) => (
              <View key={i} style={st.workoutExItem}>
                <View style={st.workoutExNum}><Text style={st.workoutExNumText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={st.workoutExName}>{ex.name}</Text>
                  <Text style={st.workoutExIns}>{ex.instructions?.join(' \u2192 ')}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={st.btnRow}>
            <TouchableOpacity style={st.pauseBtn} onPress={() => setWorkoutPaused(p => !p)} activeOpacity={0.85}>
              {workoutPaused
                ? <Play size={16} color="#fff" fill="#fff" />
                : <Pause size={16} color="#fff" fill="#fff" />
              }
              <Text style={st.pauseBtnText}>{workoutPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.discardBtn} onPress={discardWorkout} activeOpacity={0.85}>
              <RotateCcw size={16} color={colors.error} />
              <Text style={st.discardBtnText}>Discard</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity testID="complete-workout-btn" style={st.completeBtn} onPress={completeWorkout} activeOpacity={0.85}>
            <CheckCircle size={18} color="#fff" />
            <Text style={st.completeBtnText}>Complete Workout</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl },
  pageTitle: { ...typography.h1, color: colors.textMain, marginTop: spacing.md, marginBottom: spacing.lg },

  scanCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBlue, borderRadius: radius.xl, padding: 16, marginBottom: spacing.md, ...shadows.cardLight },
  scanIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  scanTitle: { ...typography.bodyMd, color: colors.textMain },
  scanSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  scanArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, gap: 10, marginBottom: spacing.md },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.textMain },

  filterScroll: { marginBottom: spacing.lg },
  filterContent: { gap: 8 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.full, backgroundColor: colors.surface },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: '#fff' },

  sectionTitle: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md },

  plansScroll: { marginBottom: spacing.lg },
  planCard: { width: 180, backgroundColor: colors.cardBlueDark, borderRadius: radius.xl, padding: 18, marginRight: 12 },
  planBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, marginBottom: 10 },
  planBadgeText: { ...typography.label, color: '#fff' },
  planName: { ...typography.bodyMd, fontWeight: '700', color: '#fff', marginBottom: 4 },
  planMeta: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 14 },
  planStart: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full },
  planStartText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  exCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBlue, borderWidth: 1.5, borderColor: 'transparent', borderRadius: radius.lg, padding: 14, marginBottom: 8 },
  exCardSel: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  exIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exIconSel: { backgroundColor: colors.primary },
  exName: { ...typography.bodyMd, fontWeight: '600', color: colors.textMain },
  exMeta: { fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize', marginTop: 2 },

  startBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.md, ...shadows.button },
  startBtnText: { ...typography.h3, color: '#fff' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.screen + 4, maxHeight: '80%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h3, color: colors.textMain },
  loadWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadText: { ...typography.body, color: colors.textSecondary },
  detectedBox: { backgroundColor: colors.primaryBg, borderRadius: radius.lg, padding: 16, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detectedName: { ...typography.h3, color: colors.primary, flex: 1 },
  confBadge: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  confText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  detectedExTitle: { ...typography.bodyMd, color: colors.textMain, marginBottom: 8 },
  detectedExRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detectedExName: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.textMain },

  workoutSafe: { flex: 1, backgroundColor: colors.background },
  workoutHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.md },
  workoutTitle: { ...typography.h3, color: colors.textMain },
  timerWrap: { alignItems: 'center', paddingVertical: 32 },
  timerCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.primary },
  timerText: { ...typography.display, color: colors.textMain },
  timerLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  timerCals: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 8 },
  pausedBanner: { alignItems: 'center', paddingVertical: 8, marginBottom: 6 },
  pausedText: { fontSize: 13, fontWeight: '600', color: colors.warning, fontStyle: 'italic' },
  workoutList: { flex: 1, paddingHorizontal: spacing.screen },
  workoutExItem: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  workoutExNum: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  workoutExNumText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  workoutExName: { ...typography.bodyMd, fontWeight: '600', color: colors.textMain },
  workoutExIns: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  btnRow: { flexDirection: 'row', paddingHorizontal: spacing.screen, gap: 10, marginBottom: 12 },
  pauseBtn: { flex: 1, backgroundColor: colors.textMuted, borderRadius: radius.md, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pauseBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  discardBtn: { flex: 1, backgroundColor: colors.errorBg, borderWidth: 1.5, borderColor: colors.error, borderRadius: radius.md, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  discardBtnText: { fontSize: 14, fontWeight: '600', color: colors.error },
  completeBtn: { backgroundColor: colors.success, borderRadius: radius.md, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: spacing.screen, marginBottom: 32 },
  completeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
