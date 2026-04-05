import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, FlatList, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell, Scan, ChevronRight, Play, CheckCircle, X, Clock, Flame, Filter } from 'lucide-react-native';
import { exerciseAPI, workoutAPI, scanAPI } from '@/src/api';
import { colors, spacing, radius, typography } from '@/src/theme';

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
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [exRes, groupRes, planRes, activeRes] = await Promise.all([
        exerciseAPI.getAll(selectedGroup ? { muscle_group: selectedGroup } : undefined),
        exerciseAPI.getMuscleGroups(),
        workoutAPI.getPlans(),
        workoutAPI.getActive(),
      ]);
      setExercises(exRes.data);
      setMuscleGroups(groupRes.data);
      setPlans(planRes.data);
      if (activeRes.data) {
        setActiveWorkout(activeRes.data);
        setShowWorkoutModal(true);
      }
    } catch (e) { console.log('Activity load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [selectedGroup]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let interval: any;
    if (activeWorkout && showWorkoutModal) {
      interval = setInterval(() => setWorkoutTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout, showWorkoutModal]);

  const handleScan = async () => {
    setScanLoading(true);
    setShowScanModal(true);
    try {
      const { data } = await scanAPI.detect();
      setScanResult(data);
    } catch { Alert.alert('Error', 'Could not detect machine'); }
    finally { setScanLoading(false); }
  };

  const toggleExercise = (id: string) => {
    setSelectedExercises(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const startWorkout = async (exerciseIds?: string[], planName?: string) => {
    const ids = exerciseIds || selectedExercises;
    if (ids.length === 0) { Alert.alert('Select Exercises', 'Pick at least one exercise'); return; }
    try {
      const { data } = await workoutAPI.start({ exercise_ids: ids, plan_name: planName });
      setActiveWorkout(data);
      setWorkoutTimer(0);
      setShowWorkoutModal(true);
      setSelectedExercises([]);
    } catch { Alert.alert('Error', 'Could not start workout'); }
  };

  const completeWorkout = async () => {
    if (!activeWorkout) return;
    try {
      const cals = activeWorkout.exercises.reduce((sum: number, ex: any) => sum + (ex.calories_per_min || 5) * (workoutTimer / 60), 0);
      await workoutAPI.complete(activeWorkout.id, {
        duration_minutes: Math.max(1, Math.round(workoutTimer / 60)),
        calories_burned: Math.round(cals),
      });
      setShowWorkoutModal(false);
      setActiveWorkout(null);
      setWorkoutTimer(0);
      Alert.alert('Workout Complete!', `Great job! ${Math.round(workoutTimer / 60)} minutes completed.`);
    } catch { Alert.alert('Error', 'Could not complete workout'); }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Activity</Text>

        {/* Scan Machine */}
        <TouchableOpacity testID="scan-machine-btn" style={styles.scanCard} onPress={handleScan}>
          <View style={styles.scanIcon}><Scan size={24} color={colors.textInverse} /></View>
          <View style={styles.scanText}>
            <Text style={styles.scanTitle}>Scan Machine</Text>
            <Text style={styles.scanSub}>Point camera at gym equipment</Text>
          </View>
          <ChevronRight size={20} color={colors.textInverse} />
        </TouchableOpacity>

        {/* Workout Plans */}
        <Text style={styles.sectionTitle}>Workout Plans</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plansScroll}>
          {plans.map((plan, i) => (
            <TouchableOpacity key={i} testID={`plan-${plan.id}`} style={styles.planCard} onPress={() => startWorkout(plan.exercises, plan.name)}>
              <View style={[styles.planBadge, { backgroundColor: plan.difficulty === 'beginner' ? '#EBF3ED' : '#FEF3C7' }]}>
                <Text style={[styles.planBadgeText, { color: plan.difficulty === 'beginner' ? colors.primary : colors.warning }]}>{plan.difficulty}</Text>
              </View>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planMeta}>{plan.days_per_week}x/week · {plan.duration_weeks} weeks</Text>
              <View style={styles.planAction}>
                <Play size={14} color={colors.primary} />
                <Text style={styles.planActionText}>Start Plan</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Muscle Group Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <Filter size={16} color={colors.textMuted} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity style={[styles.filterChip, !selectedGroup && styles.filterChipActive]} onPress={() => setSelectedGroup('')}>
            <Text style={[styles.filterChipText, !selectedGroup && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {muscleGroups.map(g => (
            <TouchableOpacity key={g} style={[styles.filterChip, selectedGroup === g && styles.filterChipActive]} onPress={() => setSelectedGroup(g)}>
              <Text style={[styles.filterChipText, selectedGroup === g && styles.filterChipTextActive]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exercise List */}
        {exercises.map((ex) => (
          <TouchableOpacity key={ex.id} testID={`exercise-${ex.id}`} style={[styles.exerciseCard, selectedExercises.includes(ex.id) && styles.exerciseCardSelected]} onPress={() => toggleExercise(ex.id)}>
            <View style={styles.exerciseIconWrap}>
              <Dumbbell size={18} color={selectedExercises.includes(ex.id) ? colors.textInverse : colors.primary} />
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseMeta}>{ex.muscle_group} · {ex.equipment} · {ex.difficulty}</Text>
            </View>
            {selectedExercises.includes(ex.id) && <CheckCircle size={20} color={colors.primary} />}
          </TouchableOpacity>
        ))}

        {/* Start Custom Workout */}
        {selectedExercises.length > 0 && (
          <TouchableOpacity testID="start-workout-btn" style={styles.startButton} onPress={() => startWorkout()}>
            <Play size={18} color={colors.textInverse} />
            <Text style={styles.startButtonText}>Start Workout ({selectedExercises.length} exercises)</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Scan Modal */}
      <Modal visible={showScanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Equipment Detected</Text>
              <TouchableOpacity testID="close-scan-modal" onPress={() => { setShowScanModal(false); setScanResult(null); }}><X size={24} color={colors.textMain} /></TouchableOpacity>
            </View>
            {scanLoading ? (
              <View style={styles.scanLoadingWrap}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.scanLoadingText}>Scanning...</Text></View>
            ) : scanResult ? (
              <>
                <View style={styles.detectedCard}>
                  <Text style={styles.detectedName}>{scanResult.detected.name}</Text>
                  <Text style={styles.detectedConf}>{Math.round(scanResult.detected.confidence * 100)}% confidence</Text>
                </View>
                <Text style={styles.detectedExTitle}>Available Exercises</Text>
                {scanResult.exercises?.map((ex: any, i: number) => (
                  <TouchableOpacity key={i} style={styles.detectedExItem} onPress={() => { toggleExercise(ex.id); setShowScanModal(false); setScanResult(null); }}>
                    <Dumbbell size={16} color={colors.primary} />
                    <Text style={styles.detectedExName}>{ex.name}</Text>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Active Workout Modal */}
      <Modal visible={showWorkoutModal} animationType="slide">
        <SafeAreaView style={styles.workoutModalSafe}>
          <View style={styles.workoutModalHeader}>
            <Text style={styles.workoutModalTitle}>{activeWorkout?.plan_name || 'Workout'}</Text>
            <TouchableOpacity testID="close-workout-modal" onPress={() => setShowWorkoutModal(false)}><X size={24} color={colors.textMain} /></TouchableOpacity>
          </View>
          <View style={styles.timerWrap}>
            <Clock size={24} color={colors.primary} />
            <Text style={styles.timerText}>{formatTime(workoutTimer)}</Text>
          </View>
          <ScrollView style={styles.workoutExList}>
            {activeWorkout?.exercises?.map((ex: any, i: number) => (
              <View key={i} style={styles.workoutExItem}>
                <View style={styles.workoutExNum}><Text style={styles.workoutExNumText}>{i + 1}</Text></View>
                <View style={styles.workoutExInfo}>
                  <Text style={styles.workoutExName}>{ex.name}</Text>
                  <Text style={styles.workoutExInstructions}>{ex.instructions?.join(' → ')}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity testID="complete-workout-btn" style={styles.completeButton} onPress={completeWorkout}>
            <CheckCircle size={20} color={colors.textInverse} />
            <Text style={styles.completeButtonText}>Complete Workout</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screen },
  pageTitle: { ...typography.h1, color: colors.textMain, marginTop: spacing.md, marginBottom: spacing.lg },
  scanCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  scanIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  scanText: { flex: 1 },
  scanTitle: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  scanSub: { ...typography.bodySm, color: 'rgba(255,255,255,0.7)' },
  sectionTitle: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md },
  plansScroll: { marginBottom: spacing.lg },
  planCard: { width: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginRight: spacing.sm },
  planBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: spacing.sm },
  planBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  planName: { ...typography.body, fontWeight: '600', color: colors.textMain, marginBottom: 4 },
  planMeta: { ...typography.bodySm, color: colors.textMuted, marginBottom: spacing.sm },
  planAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planActionText: { ...typography.bodySm, color: colors.primary, fontWeight: '600' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterScroll: { marginBottom: spacing.md },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, marginRight: spacing.sm },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { ...typography.bodySm, fontWeight: '500', color: colors.textMuted },
  filterChipTextActive: { color: colors.textInverse },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  exerciseCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  exerciseIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: '600', color: colors.textMain },
  exerciseMeta: { ...typography.bodySm, color: colors.textMuted, textTransform: 'capitalize' },
  startButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.md },
  startButtonText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.screen, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h3, color: colors.textMain },
  scanLoadingWrap: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  scanLoadingText: { ...typography.body, color: colors.textMuted },
  detectedCard: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  detectedName: { ...typography.h3, color: colors.primary },
  detectedConf: { ...typography.bodySm, color: colors.textMuted },
  detectedExTitle: { ...typography.body, fontWeight: '600', color: colors.textMain, marginBottom: spacing.sm },
  detectedExItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  detectedExName: { flex: 1, ...typography.body, color: colors.textMain },
  workoutModalSafe: { flex: 1, backgroundColor: colors.background },
  workoutModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.md },
  workoutModalTitle: { ...typography.h2, color: colors.textMain },
  timerWrap: { alignItems: 'center', paddingVertical: spacing.xl, flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  timerText: { fontSize: 48, fontWeight: '800', color: colors.textMain, letterSpacing: -1 },
  workoutExList: { flex: 1, paddingHorizontal: spacing.screen },
  workoutExItem: { flexDirection: 'row', marginBottom: spacing.md, gap: 12 },
  workoutExNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  workoutExNumText: { ...typography.body, fontWeight: '700', color: colors.primary },
  workoutExInfo: { flex: 1 },
  workoutExName: { ...typography.body, fontWeight: '600', color: colors.textMain },
  workoutExInstructions: { ...typography.bodySm, color: colors.textMuted, marginTop: 2 },
  completeButton: { backgroundColor: colors.success, borderRadius: radius.md, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: spacing.screen, marginBottom: spacing.xl },
  completeButtonText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
});
