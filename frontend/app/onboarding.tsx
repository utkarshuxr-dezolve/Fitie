import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dumbbell } from 'lucide-react-native';
import { useAuth } from '@/src/AuthContext';
import { userAPI } from '@/src/api';
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
  { id: 'light', label: 'Lightly Active' },
  { id: 'moderate', label: 'Moderately Active' },
  { id: 'active', label: 'Very Active' },
  { id: 'very_active', label: 'Extremely Active' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [goal, setGoal] = useState('general_fitness');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (!user) { router.replace('/(auth)/login'); return; }
    setSaving(true);
    try {
      const profile: Record<string, unknown> = { goal, activity_level: activityLevel };
      if (weight) profile.weight = parseFloat(weight);
      if (height) profile.height = parseFloat(height);
      await userAPI.updateProfile(profile);
      await AsyncStorage.setItem('onboarding_complete', 'true');
      router.replace('/(tabs)');
    } catch {
      // Still save onboarding flag so user isn't stuck
      await AsyncStorage.setItem('onboarding_complete', 'true');
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.heroSection}>
            <View style={s.logoCircle}>
              <Dumbbell size={32} color={colors.textInverse} strokeWidth={2.5} />
            </View>
            <Text style={s.brandName}>FITIE</Text>
            <Text style={s.brandSub}>Welcome{firstName ? `, ${firstName}` : ''}!</Text>
          </View>

          <View style={s.formCard}>
            <Text style={s.formTitle}>Let&apos;s Personalize</Text>
            <Text style={s.formSub}>A few quick questions to tailor your experience</Text>

            <Text style={s.sectionLabel}>What&apos;s your goal?</Text>
            <View style={s.chipWrap}>
              {goals.map(g => (
                <TouchableOpacity key={g.id} style={[s.chip, goal === g.id && s.chipActive]} onPress={() => setGoal(g.id)}>
                  <Text style={[s.chipText, goal === g.id && s.chipTextActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionLabel}>Activity Level</Text>
            <View style={s.chipWrap}>
              {levels.map(l => (
                <TouchableOpacity key={l.id} style={[s.chip, activityLevel === l.id && s.chipActive]} onPress={() => setActivityLevel(l.id)}>
                  <Text style={[s.chipText, activityLevel === l.id && s.chipTextActive]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>WEIGHT (KG) — OPTIONAL</Text>
                <TextInput style={s.input} placeholder="70" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={weight} onChangeText={setWeight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>HEIGHT (CM) — OPTIONAL</Text>
                <TextInput style={s.input} placeholder="175" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={height} onChangeText={setHeight} />
              </View>
            </View>

            <TouchableOpacity style={s.primaryBtn} onPress={handleComplete} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Get Started</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  heroSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 32, backgroundColor: colors.primary },
  logoCircle: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  brandName: { fontSize: 32, fontWeight: '900', color: colors.textInverse, letterSpacing: 4 },
  brandSub: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  formCard: { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: spacing.screen + 4, paddingTop: 28, paddingBottom: 24, minHeight: 400 },
  formTitle: { ...typography.h1, color: colors.textMain, marginBottom: 4 },
  formSub: { ...typography.body, color: colors.textSecondary, marginBottom: 20 },
  sectionLabel: { ...typography.label, color: colors.textMuted, marginBottom: 8, marginTop: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  inputRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  inputLabel: { ...typography.label, color: colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textMain },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 24, ...shadows.button },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: colors.textInverse },
});
