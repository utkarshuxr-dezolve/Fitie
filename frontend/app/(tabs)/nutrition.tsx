import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, X, Coffee, Sun, Moon, Cookie } from 'lucide-react-native';
import { nutritionAPI } from '@/src/api';
import { colors, spacing, radius, typography, shadows } from '@/src/theme';
import { Skeleton, SkeletonCard, SkeletonLine } from '@/src/components/Skeleton';
import { formatNetworkError } from '@/src/formatError';
import { useAuth } from '@/src/AuthContext';

const mealIcons: Record<string, typeof Coffee> = { breakfast: Coffee, lunch: Sun, dinner: Moon, snack: Cookie };

export default function NutritionScreen() {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [mealType, setMealType] = useState('lunch');
  const [manual, setManual] = useState({ food_name: '', calories: '', protein: '', carbs: '', fat: '' });

  const loadData = useCallback(async () => {
    try { const { data } = await nutritionAPI.getToday(); setTodayData(data); }
    catch (e: any) { console.log('Nutrition load error:', formatNetworkError(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = async (q: string) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchRes([]); return; }
    setSearching(true);
    try { const { data } = await nutritionAPI.searchFoods(q); setSearchRes(data); }
    catch { setSearchRes([]); }
    finally { setSearching(false); }
  };

  const addFromSearch = async (food: any) => {
    try {
      await nutritionAPI.logMeal({ food_name: food.name, calories: food.calories, protein: food.protein || 0, carbs: food.carbs || 0, fat: food.fat || 0, meal_type: mealType });
      setShowAdd(false); setSearchQ(''); setSearchRes([]); loadData();
    } catch (e: any) { Alert.alert('Log Error', formatNetworkError(e, 'Could not log meal')); }
  };

  const addManual = async () => {
    if (!manual.food_name || !manual.calories) { Alert.alert('Missing Info', 'Food name and calories are required'); return; }
    try {
      await nutritionAPI.logMeal({ food_name: manual.food_name, calories: parseFloat(manual.calories), protein: parseFloat(manual.protein) || 0, carbs: parseFloat(manual.carbs) || 0, fat: parseFloat(manual.fat) || 0, meal_type: mealType });
      setShowAdd(false); setManual({ food_name: '', calories: '', protein: '', carbs: '', fat: '' }); loadData();
    } catch (e: any) { Alert.alert('Log Error', formatNetworkError(e, 'Could not log meal')); }
  };

  const goal = 2200;
  const eaten = todayData?.totals?.calories || 0;
  const pct = Math.min((eaten / goal) * 100, 100);
  const remaining = Math.max(goal - eaten, 0);
  const firstName = user?.name?.split(' ')[0] || '';

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
            <Skeleton height={28} width="40%" />
            <Skeleton height={44} width={44} borderRadius={14} />
          </View>
          <Skeleton height={200} borderRadius={24} style={{ marginBottom: spacing.lg }} />
          <SkeletonLine lines={2} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
        <View style={s.headRow}>
          <View>
            <Text style={s.pageTitle}>Nutrition</Text>
            {firstName && <Text style={s.subtitle}>Track your meals, {firstName}</Text>}
          </View>
          <TouchableOpacity testID="add-meal-btn" style={s.addBtn} onPress={() => setShowAdd(true)}>
            <Plus size={20} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Calorie Circle */}
        <View style={s.calCard}>
          <View style={s.calCircle}>
            <View style={s.calRing}>
              <View style={[s.calFill, { height: `${pct}%` }]} />
            </View>
            <View style={s.calCenter}>
              <Text style={s.calValue}>{Math.round(eaten)}</Text>
              <Text style={s.calLabel}>of {goal} cal</Text>
              {remaining > 0 && <Text style={s.calRemain}>{remaining} remaining</Text>}
            </View>
          </View>

          <View style={s.macroRow}>
            <MacroChip label="Protein" val={todayData?.totals?.protein || 0} color={colors.primary} />
            <MacroChip label="Carbs" val={todayData?.totals?.carbs || 0} color={colors.warning} />
            <MacroChip label="Fat" val={todayData?.totals?.fat || 0} color={colors.pink} />
          </View>
        </View>

        {/* Meals List */}
        <Text style={s.sectionTitle}>Today&apos;s Meals</Text>
        {todayData?.meals?.length > 0 ? todayData.meals.map((m: any, i: number) => {
          const Icon = mealIcons[m.meal_type] || Cookie;
          return (
            <View key={i} style={s.mealCard}>
              <View style={s.mealIcon}><Icon size={16} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.mealName}>{m.food_name}</Text>
                <Text style={s.mealMeta}>{m.meal_type} &middot; P:{Math.round(m.protein)}g C:{Math.round(m.carbs)}g F:{Math.round(m.fat)}g</Text>
              </View>
              <View style={s.calBadge}><Text style={s.calBadgeText}>{Math.round(m.calories)} cal</Text></View>
            </View>
          );
        }) : (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No meals logged</Text>
            <Text style={s.emptySub}>Tap + to log your first meal</Text>
            <TouchableOpacity testID="empty-add-meal-btn" style={s.emptyBtn} onPress={() => setShowAdd(true)}>
              <Text style={s.emptyBtnText}>Log Meal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Log Meal</Text>
              <TouchableOpacity testID="close-meal-modal" onPress={() => { setShowAdd(false); setSearchQ(''); setSearchRes([]); }}><X size={22} color={colors.textMain} /></TouchableOpacity>
            </View>

            <View style={s.typeRow}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(t => {
                const I = mealIcons[t] || Cookie;
                return (
                  <TouchableOpacity key={t} testID={`meal-type-${t}`} style={[s.typeChip, mealType === t && s.typeChipActive]} onPress={() => setMealType(t)}>
                    <I size={13} color={mealType === t ? '#fff' : colors.textSecondary} />
                    <Text style={[s.typeText, mealType === t && s.typeTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.searchWrap}>
              <Search size={16} color={colors.textMuted} />
              <TextInput testID="food-search-input" style={s.searchInput} placeholder="Search foods..." placeholderTextColor={colors.textMuted} value={searchQ} onChangeText={handleSearch} />
            </View>

            {searching && <ActivityIndicator style={{ marginVertical: 8 }} color={colors.primary} />}
            {searchRes.length > 0 && (
              <ScrollView style={s.searchList}>
                {searchRes.map((f, i) => (
                  <TouchableOpacity key={i} testID={`food-result-${f.id}`} style={s.searchItem} onPress={() => addFromSearch(f)}>
                    <View style={{ flex: 1 }}><Text style={s.searchName}>{f.name}</Text><Text style={s.searchMeta}>P:{f.protein}g C:{f.carbs}g F:{f.fat}g</Text></View>
                    <Text style={s.searchCal}>{f.calories} cal</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={s.manualLabel}>Or add manually</Text>
            <TextInput testID="manual-food-name" style={s.manualInput} placeholder="Food name" placeholderTextColor={colors.textMuted} value={manual.food_name} onChangeText={v => setManual(p => ({ ...p, food_name: v }))} />
            <View style={s.manualRow}>
              <TextInput testID="manual-calories" style={[s.manualInput, { flex: 1 }]} placeholder="Calories" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={manual.calories} onChangeText={v => setManual(p => ({ ...p, calories: v }))} />
              <TextInput style={[s.manualInput, { flex: 1 }]} placeholder="Protein" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={manual.protein} onChangeText={v => setManual(p => ({ ...p, protein: v }))} />
            </View>
            <View style={s.manualRow}>
              <TextInput style={[s.manualInput, { flex: 1 }]} placeholder="Carbs" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={manual.carbs} onChangeText={v => setManual(p => ({ ...p, carbs: v }))} />
              <TextInput style={[s.manualInput, { flex: 1 }]} placeholder="Fat" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={manual.fat} onChangeText={v => setManual(p => ({ ...p, fat: v }))} />
            </View>
            <TouchableOpacity testID="manual-add-btn" style={s.addMealBtn} onPress={addManual} activeOpacity={0.85}>
              <Text style={s.addMealBtnText}>Add Meal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function ActivityIndicator({ style, color }: { style?: object; color: string }) {
  return <View />;
}

function MacroChip({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <View style={mc.chip}>
      <View style={[mc.dot, { backgroundColor: color }]} />
      <View><Text style={mc.val}>{Math.round(val)}g</Text><Text style={mc.label}>{label}</Text></View>
    </View>
  );
}

const mc = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  val: { ...typography.h2, color: colors.textMain },
  label: { fontSize: 11, color: colors.textSecondary },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  pageTitle: { ...typography.h1, color: colors.textMain },
  subtitle: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.button },

  calCard: { backgroundColor: colors.cardBlue, borderRadius: radius.xl, padding: 24, alignItems: 'center', marginBottom: spacing.lg, ...shadows.cardLight },
  calCircle: { marginBottom: 20, position: 'relative' },
  calRing: { width: 150, height: 150, borderRadius: 75, backgroundColor: colors.surfaceBlue, overflow: 'hidden', justifyContent: 'flex-end' },
  calFill: { backgroundColor: colors.primaryBg, width: '100%' },
  calCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  calValue: { ...typography.stat, color: colors.textMain },
  calLabel: { fontSize: 12, color: colors.textSecondary },
  calRemain: { fontSize: 11, fontWeight: '600', color: colors.success, marginTop: 1 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },

  sectionTitle: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md },
  mealCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBlue, borderRadius: radius.lg, padding: 14, marginBottom: 8 },
  mealIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mealName: { ...typography.bodyMd, fontWeight: '600', color: colors.textMain },
  mealMeta: { fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize', marginTop: 1 },
  calBadge: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  calBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  emptyCard: { alignItems: 'center', backgroundColor: colors.cardBlue, borderRadius: radius.xl, padding: 32, gap: 8 },
  emptyTitle: { ...typography.h2, color: colors.textMain },
  emptySub: { fontSize: 13, color: colors.textSecondary },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.full, marginTop: 8 },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.screen + 4, maxHeight: '90%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h3, color: colors.textMain },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface },
  typeChipActive: { backgroundColor: colors.primary },
  typeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  typeTextActive: { color: '#fff' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: colors.textMain },
  searchList: { maxHeight: 150, marginVertical: 8 },
  searchItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  searchName: { ...typography.body, color: colors.textMain },
  searchMeta: { fontSize: 11, color: colors.textSecondary },
  searchCal: { fontSize: 12, fontWeight: '700', color: colors.primary },
  manualLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 12, marginBottom: 8 },
  manualInput: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textMain, marginBottom: 8 },
  manualRow: { flexDirection: 'row', gap: 8 },
  addMealBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 8, ...shadows.button },
  addMealBtnText: { ...typography.h3, color: '#fff' },
});
