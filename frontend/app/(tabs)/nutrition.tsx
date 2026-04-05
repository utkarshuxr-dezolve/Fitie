import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UtensilsCrossed, Plus, Search, X, Coffee, Sun, Moon, Cookie } from 'lucide-react-native';
import { nutritionAPI } from '@/src/api';
import { colors, spacing, radius, typography } from '@/src/theme';

const mealTypeIcons: any = { breakfast: Coffee, lunch: Sun, dinner: Moon, snack: Cookie };

export default function NutritionScreen() {
  const [todayData, setTodayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [manualFood, setManualFood] = useState({ food_name: '', calories: '', protein: '', carbs: '', fat: '' });

  const loadData = useCallback(async () => {
    try {
      const { data } = await nutritionAPI.getToday();
      setTodayData(data);
    } catch (e) { console.log('Nutrition load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await nutritionAPI.searchFoods(q);
      setSearchResults(data);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const addFromSearch = async (food: any) => {
    try {
      await nutritionAPI.logMeal({
        food_name: food.name,
        calories: food.calories,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        meal_type: selectedMealType,
      });
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
      loadData();
    } catch { Alert.alert('Error', 'Could not log meal'); }
  };

  const addManual = async () => {
    if (!manualFood.food_name || !manualFood.calories) {
      Alert.alert('Required', 'Name and calories are required');
      return;
    }
    try {
      await nutritionAPI.logMeal({
        food_name: manualFood.food_name,
        calories: parseFloat(manualFood.calories),
        protein: parseFloat(manualFood.protein) || 0,
        carbs: parseFloat(manualFood.carbs) || 0,
        fat: parseFloat(manualFood.fat) || 0,
        meal_type: selectedMealType,
      });
      setShowAddModal(false);
      setManualFood({ food_name: '', calories: '', protein: '', carbs: '', fat: '' });
      loadData();
    } catch { Alert.alert('Error', 'Could not log meal'); }
  };

  const calGoal = 2200;
  const calPct = todayData ? Math.min((todayData.totals.calories / calGoal) * 100, 100) : 0;

  if (loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Nutrition</Text>
          <TouchableOpacity testID="add-meal-btn" style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Plus size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Calorie Ring */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieRing}>
            <View style={styles.ringOuter}>
              <View style={[styles.ringFill, { height: `${calPct}%` }]} />
              <View style={styles.ringInner}>
                <Text style={styles.ringValue}>{Math.round(todayData?.totals?.calories || 0)}</Text>
                <Text style={styles.ringLabel}>of {calGoal} cal</Text>
              </View>
            </View>
          </View>
          <View style={styles.macroRow}>
            <MacroChip label="Protein" value={todayData?.totals?.protein || 0} color={colors.primary} unit="g" />
            <MacroChip label="Carbs" value={todayData?.totals?.carbs || 0} color={colors.warning} unit="g" />
            <MacroChip label="Fat" value={todayData?.totals?.fat || 0} color="#EC4899" unit="g" />
          </View>
        </View>

        {/* Today's Meals */}
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {todayData?.meals?.length > 0 ? (
          todayData.meals.map((meal: any, i: number) => {
            const Icon = mealTypeIcons[meal.meal_type] || Cookie;
            return (
              <View key={i} style={styles.mealCard}>
                <View style={styles.mealIconWrap}><Icon size={18} color={colors.primary} /></View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.food_name}</Text>
                  <Text style={styles.mealMeta}>{meal.meal_type} · P:{Math.round(meal.protein)}g C:{Math.round(meal.carbs)}g F:{Math.round(meal.fat)}g</Text>
                </View>
                <Text style={styles.mealCal}>{Math.round(meal.calories)} cal</Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <UtensilsCrossed size={32} color={colors.border} />
            <Text style={styles.emptyText}>No meals logged today</Text>
            <TouchableOpacity testID="empty-add-meal-btn" style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyBtnText}>Log your first meal</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Meal</Text>
              <TouchableOpacity testID="close-meal-modal" onPress={() => { setShowAddModal(false); setSearchQuery(''); setSearchResults([]); }}><X size={24} color={colors.textMain} /></TouchableOpacity>
            </View>

            {/* Meal Type */}
            <View style={styles.mealTypeRow}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(t => {
                const Icon = mealTypeIcons[t] || Cookie;
                return (
                  <TouchableOpacity key={t} testID={`meal-type-${t}`} style={[styles.mealTypeChip, selectedMealType === t && styles.mealTypeChipActive]} onPress={() => setSelectedMealType(t)}>
                    <Icon size={14} color={selectedMealType === t ? colors.primary : colors.textMuted} />
                    <Text style={[styles.mealTypeText, selectedMealType === t && styles.mealTypeTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <Search size={18} color={colors.textMuted} />
              <TextInput testID="food-search-input" style={styles.searchInput} placeholder="Search foods..." placeholderTextColor={colors.textMuted} value={searchQuery} onChangeText={handleSearch} />
            </View>

            {searching && <ActivityIndicator style={styles.searchLoader} color={colors.primary} />}
            
            {searchResults.length > 0 && (
              <ScrollView style={styles.searchResults}>
                {searchResults.map((food, i) => (
                  <TouchableOpacity key={i} testID={`food-result-${food.id}`} style={styles.searchResultItem} onPress={() => addFromSearch(food)}>
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>{food.name}</Text>
                      <Text style={styles.searchResultMeta}>P:{food.protein}g C:{food.carbs}g F:{food.fat}g</Text>
                    </View>
                    <Text style={styles.searchResultCal}>{food.calories} cal</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Manual Entry */}
            <Text style={styles.manualTitle}>Or add manually</Text>
            <TextInput testID="manual-food-name" style={styles.manualInput} placeholder="Food name" placeholderTextColor={colors.textMuted} value={manualFood.food_name} onChangeText={v => setManualFood(p => ({ ...p, food_name: v }))} />
            <View style={styles.manualRow}>
              <TextInput testID="manual-calories" style={[styles.manualInput, styles.manualSmall]} placeholder="Calories" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={manualFood.calories} onChangeText={v => setManualFood(p => ({ ...p, calories: v }))} />
              <TextInput style={[styles.manualInput, styles.manualSmall]} placeholder="Protein" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={manualFood.protein} onChangeText={v => setManualFood(p => ({ ...p, protein: v }))} />
            </View>
            <View style={styles.manualRow}>
              <TextInput style={[styles.manualInput, styles.manualSmall]} placeholder="Carbs" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={manualFood.carbs} onChangeText={v => setManualFood(p => ({ ...p, carbs: v }))} />
              <TextInput style={[styles.manualInput, styles.manualSmall]} placeholder="Fat" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={manualFood.fat} onChangeText={v => setManualFood(p => ({ ...p, fat: v }))} />
            </View>
            <TouchableOpacity testID="manual-add-btn" style={styles.addMealBtn} onPress={addManual}>
              <Text style={styles.addMealBtnText}>Add Meal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function MacroChip({ label, value, color, unit }: { label: string; value: number; color: string; unit: string }) {
  return (
    <View style={chipStyles.chip}>
      <View style={[chipStyles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={chipStyles.value}>{Math.round(value)}{unit}</Text>
        <Text style={chipStyles.label}>{label}</Text>
      </View>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  value: { ...typography.body, fontWeight: '700', color: colors.textMain },
  label: { ...typography.bodySm, color: colors.textMuted, fontSize: 12 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screen },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  pageTitle: { ...typography.h1, color: colors.textMain },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  calorieCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, alignItems: 'center' },
  calorieRing: { marginBottom: spacing.lg },
  ringOuter: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.surfaceSecondary, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  ringFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.primaryLight },
  ringInner: { alignItems: 'center', zIndex: 1 },
  ringValue: { fontSize: 32, fontWeight: '800', color: colors.textMain, letterSpacing: -1 },
  ringLabel: { ...typography.bodySm, color: colors.textMuted },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  sectionTitle: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md },
  mealCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  mealIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mealInfo: { flex: 1 },
  mealName: { ...typography.body, fontWeight: '600', color: colors.textMain },
  mealMeta: { ...typography.bodySm, color: colors.textMuted, textTransform: 'capitalize' },
  mealCal: { ...typography.bodySm, fontWeight: '600', color: colors.primary },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm },
  emptyText: { ...typography.body, fontWeight: '600', color: colors.textMain },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 8 },
  emptyBtnText: { ...typography.bodySm, fontWeight: '600', color: colors.textInverse },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.screen, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h3, color: colors.textMain },
  mealTypeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  mealTypeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary },
  mealTypeChipActive: { backgroundColor: colors.primaryLight },
  mealTypeText: { ...typography.bodySm, color: colors.textMuted, fontWeight: '500' },
  mealTypeTextActive: { color: colors.primary, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, gap: 8, marginBottom: spacing.sm },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.textMain },
  searchLoader: { marginVertical: spacing.sm },
  searchResults: { maxHeight: 160, marginBottom: spacing.md },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchResultInfo: { flex: 1 },
  searchResultName: { ...typography.body, fontWeight: '500', color: colors.textMain },
  searchResultMeta: { ...typography.bodySm, color: colors.textMuted },
  searchResultCal: { ...typography.bodySm, fontWeight: '600', color: colors.primary },
  manualTitle: { ...typography.bodySm, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm, marginTop: spacing.sm },
  manualInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textMain, marginBottom: spacing.sm },
  manualRow: { flexDirection: 'row', gap: spacing.sm },
  manualSmall: { flex: 1 },
  addMealBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  addMealBtnText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
});
